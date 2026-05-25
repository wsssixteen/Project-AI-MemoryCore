#!/usr/bin/env python3
"""Phase B of etanah-knowledge-graph-build skill — BPMN 2.0 structural node emission.

Reads `*.bpmn20.xml` files (Flowable BPMN 2.0) from a directory and emits a
subdomain graph JSON with one node per process / task / gateway, plus edges
per sequenceFlow / containment / serviceTask→bean (when --resolve-services).

Why this exists:
- Tree-sitter has no BPMN grammar; vanilla Understand-Anything extracts ZERO
  structure from BPMN files (verified Stage 1 finding).
- The deterministic parse is well-defined — `xml.etree.ElementTree` over a
  fixed BPMN 2.0 schema with Flowable's `flowable:expression` dispatcher
  pattern (verified across 20 deployed pelupusan BPMN files in
  inputs/bpmn-inventory.md).
- This script reuses the verified parse logic to produce subdomain-graph
  nodes/edges that merge into the unified graph.

Usage:
  python bpmn_structural_extractor.py \\
    --bpmn-dir <folder-of-bpmn20.xml-files> \\
    --project-root <project-root-for-relative-paths> \\
    --output <path-to-subdomain-graph.json> \\
    [--resolve-services]   # OPT IN — grep --project-root source for @Service("beanName")/@Component("beanName")

Output schema: Zod-valid GraphNode + GraphEdge envelope, ready for merge.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

BPMN_NS = "{http://www.omg.org/spec/BPMN/20100524/MODEL}"
FLOWABLE_NS = "{http://flowable.org/bpmn}"
ACTIVITI_NS = "{http://activiti.org/bpmn}"

# Pattern verified across 20 pelupusan BPMN files
# (see inputs/bpmn-inventory.md): every serviceTask routes through
# flowableTaskListener.receiveServiceTask("beanName", "URUSAN", ...).
DISPATCHER_RE = re.compile(
    r"receiveServiceTask\(\s*(?:&quot;|\")([^&\"]+)(?:&quot;|\")",
    re.IGNORECASE,
)


def get_attr(el, *names):
    """Try multiple namespaced attribute names; return the first that's set."""
    for n in names:
        v = el.get(n)
        if v is not None:
            return v
    return None


def parse_bpmn_file(path: Path, rel_path: str) -> tuple[list, list, dict]:
    nodes = []
    edges = []
    counts = {
        "processes": 0,
        "user_tasks": 0,
        "service_tasks": 0,
        "script_tasks": 0,
        "call_activities": 0,
        "sub_processes": 0,
        "exclusive_gateways": 0,
        "parallel_gateways": 0,
        "sequence_flows": 0,
        "service_beans_found": 0,
    }

    try:
        tree = ET.parse(path)
    except ET.ParseError as e:
        print(f"WARN: skipping {path} (parse error: {e})", file=sys.stderr)
        return nodes, edges, counts

    root = tree.getroot()

    # Map: BPMN element id -> our node id, scoped per process
    id_to_node = {}

    for proc in root.iter(f"{BPMN_NS}process"):
        proc_id = proc.get("id")
        if not proc_id:
            continue
        proc_node_id = f"flow:{rel_path}:{proc_id}"
        proc_name = proc.get("name") or proc_id
        doc = ""
        doc_el = proc.find(f"{BPMN_NS}documentation")
        if doc_el is not None and doc_el.text:
            doc = doc_el.text.strip()
        nodes.append({
            "id": proc_node_id,
            "type": "flow",
            "name": proc_name,
            "filePath": rel_path,
            "summary": (
                f"Flowable BPMN process definition: {proc_name}. "
                f"Source: {rel_path}. "
                + (f"Documentation: {doc}. " if doc else "")
                + "Extracted by Stage 2 BPMN extractor (vanilla Understand-Anything cannot parse BPMN — no tree-sitter grammar)."
            ),
            "tags": ["bpmn", "flowable", "stage2-bpmn"],
            "complexity": "complex",
        })
        counts["processes"] += 1
        id_to_node[proc_id] = proc_node_id

        # Walk children of the process
        for el in proc.iter():
            tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
            el_id = el.get("id")
            if not el_id:
                continue

            if tag in ("userTask", "serviceTask", "scriptTask", "callActivity", "subProcess", "exclusiveGateway", "parallelGateway", "sendTask", "receiveTask"):
                node_id = f"step:{rel_path}:{el_id}"
                name = el.get("name") or el_id
                tags = ["bpmn-step", tag, "stage2-bpmn"]
                attrs = {}
                summary_extra = ""

                if tag == "serviceTask":
                    counts["service_tasks"] += 1
                    expr = get_attr(el, f"{FLOWABLE_NS}expression", f"{ACTIVITI_NS}expression")
                    direct_class = get_attr(el, f"{FLOWABLE_NS}class", f"{ACTIVITI_NS}class")
                    if expr:
                        m = DISPATCHER_RE.search(expr)
                        if m:
                            attrs["beanName"] = m.group(1)
                            summary_extra = f" Dispatches via flowableTaskListener → bean '{m.group(1)}'."
                            counts["service_beans_found"] += 1
                    if direct_class:
                        attrs["delegateClass"] = direct_class
                        summary_extra = f" Direct delegate class: {direct_class}."
                elif tag == "userTask":
                    counts["user_tasks"] += 1
                    form_key = get_attr(el, f"{FLOWABLE_NS}formKey", f"{ACTIVITI_NS}formKey")
                    if form_key:
                        attrs["formKey"] = form_key
                        summary_extra = f" Form key: {form_key}."
                elif tag == "callActivity":
                    counts["call_activities"] += 1
                    called = el.get("calledElement")
                    if called:
                        attrs["calledElement"] = called
                elif tag == "subProcess":
                    counts["sub_processes"] += 1
                elif tag == "exclusiveGateway":
                    counts["exclusive_gateways"] += 1
                elif tag == "parallelGateway":
                    counts["parallel_gateways"] += 1
                elif tag == "scriptTask":
                    counts["script_tasks"] += 1

                node = {
                    "id": node_id,
                    "type": "step",
                    "name": name,
                    "filePath": rel_path,
                    "summary": f"BPMN {tag}: {name}.{summary_extra} Inside process {proc_id} in {rel_path}.",
                    "tags": tags,
                    "complexity": "simple",
                }
                if attrs:
                    node["bpmnAttrs"] = attrs  # passthrough — Zod schema is .passthrough()
                nodes.append(node)
                id_to_node[el_id] = node_id

                # contains_flow edge: process → step
                edges.append({
                    "source": proc_node_id,
                    "target": node_id,
                    "type": "contains_flow",
                    "direction": "forward",
                    "weight": 1.0,
                })

        # sequenceFlow edges (process-scoped)
        for sf in proc.iter(f"{BPMN_NS}sequenceFlow"):
            src = sf.get("sourceRef")
            tgt = sf.get("targetRef")
            if not src or not tgt:
                continue
            src_node = id_to_node.get(src)
            tgt_node = id_to_node.get(tgt)
            if not src_node or not tgt_node:
                continue  # endpoints can be startEvent/endEvent which we don't node-ify in v1
            counts["sequence_flows"] += 1
            cond_el = sf.find(f"{BPMN_NS}conditionExpression")
            desc = sf.get("name") or ""
            if cond_el is not None and cond_el.text:
                desc = (desc + " [if: " + cond_el.text.strip() + "]").strip()
            edge = {
                "source": src_node,
                "target": tgt_node,
                "type": "flow_step",
                "direction": "forward",
                "weight": 0.7,
            }
            if desc:
                edge["description"] = desc
            edges.append(edge)

        # callActivity → flow edge (containment between processes)
        for ca in proc.iter(f"{BPMN_NS}callActivity"):
            called = ca.get("calledElement")
            ca_id = ca.get("id")
            if not called or not ca_id:
                continue
            ca_node = id_to_node.get(ca_id)
            # Best-effort cross-file flow lookup: same rel-path won't help; cross-process within same file does
            target_flow_id = f"flow:{rel_path}:{called}"  # may be in a different BPMN file; merge phase will drop if dangling
            edges.append({
                "source": ca_node,
                "target": target_flow_id,
                "type": "contains_flow",
                "direction": "forward",
                "weight": 0.8,
                "description": f"callActivity references process {called}",
            })

    return nodes, edges, counts


def resolve_service_beans(nodes: list, project_root: Path) -> tuple[int, list]:
    """For every serviceTask with beanName, grep --project-root for @Service('bean')/@Component('bean') and emit a `calls` edge."""
    edges = []
    resolved = 0
    bean_names = []
    for n in nodes:
        if n.get("type") == "step" and "bpmnAttrs" in n and "beanName" in n["bpmnAttrs"]:
            bean_names.append((n["id"], n["bpmnAttrs"]["beanName"]))

    if not bean_names:
        return 0, []

    # Grep once per bean name (could batch with multi-pattern, but per-bean keeps it readable)
    for source_node_id, bean in bean_names:
        # Pattern: @Service("bean") or @Service(value="bean") or @Component(...) variants
        pattern = rf'@(?:Service|Component|Repository|Controller)\s*\(\s*(?:value\s*=\s*)?["\']{re.escape(bean)}["\']\s*\)'
        try:
            res = subprocess.run(
                ["grep", "-rln", "-E", pattern, str(project_root)],
                capture_output=True, text=True, timeout=30,
            )
            for hit_path in res.stdout.splitlines():
                if not hit_path.strip():
                    continue
                rel = os.path.relpath(hit_path.strip(), str(project_root)).replace("\\", "/")
                # Best-effort class name from file name
                class_name = Path(rel).stem
                edges.append({
                    "source": source_node_id,
                    "target": f"class:{rel}:{class_name}",
                    "type": "calls",
                    "direction": "forward",
                    "weight": 0.8,
                    "description": f"BPMN serviceTask dispatches to Spring bean '{bean}' resolved at {rel}",
                })
                resolved += 1
                break  # only first hit per bean for v1; if multiple, log all in v1.1
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            print(f"WARN: grep skipped for bean '{bean}' ({e})", file=sys.stderr)
            continue
    return resolved, edges


def main():
    p = argparse.ArgumentParser(description="Stage 2 Phase B — BPMN structural node extractor")
    p.add_argument("--bpmn-dir", required=True, help="Directory containing *.bpmn20.xml files")
    p.add_argument("--project-root", required=True, help="Project root (for relative paths + bean resolution)")
    p.add_argument("--output", required=True, help="Where to write the subdomain graph JSON")
    p.add_argument("--resolve-services", action="store_true", help="Grep project source for @Service('beanName') to emit `calls` edges (default: off)")
    args = p.parse_args()

    bpmn_dir = Path(args.bpmn_dir)
    project_root = Path(args.project_root)

    if not bpmn_dir.exists():
        print(f"WARN: BPMN dir not found: {bpmn_dir}", file=sys.stderr)
        # Emit empty subdomain so merge skips cleanly
        Path(args.output).write_text(json.dumps({"nodes": [], "edges": [], "_stage2_meta": {"phase": "B_bpmn", "skipped": "bpmn-dir missing"}}), encoding="utf-8")
        sys.exit(0)

    bpmn_files = sorted(bpmn_dir.glob("*.bpmn20.xml"))
    if not bpmn_files:
        print(f"WARN: no *.bpmn20.xml files in {bpmn_dir}", file=sys.stderr)
        Path(args.output).write_text(json.dumps({"nodes": [], "edges": [], "_stage2_meta": {"phase": "B_bpmn", "skipped": "no-bpmn-files"}}), encoding="utf-8")
        sys.exit(0)

    all_nodes = []
    all_edges = []
    total_counts = {
        "files": 0, "processes": 0, "user_tasks": 0, "service_tasks": 0,
        "call_activities": 0, "sub_processes": 0,
        "exclusive_gateways": 0, "parallel_gateways": 0,
        "sequence_flows": 0, "service_beans_found": 0, "service_beans_resolved": 0,
    }

    for bpmn in bpmn_files:
        rel = os.path.relpath(bpmn, project_root).replace("\\", "/")
        nodes, edges, counts = parse_bpmn_file(bpmn, rel)
        all_nodes.extend(nodes)
        all_edges.extend(edges)
        total_counts["files"] += 1
        for k, v in counts.items():
            total_counts[k] = total_counts.get(k, 0) + v

    if args.resolve_services:
        resolved, calls_edges = resolve_service_beans(all_nodes, project_root)
        all_edges.extend(calls_edges)
        total_counts["service_beans_resolved"] = resolved

    out = {
        "nodes": all_nodes,
        "edges": all_edges,
        "_stage2_meta": {
            "phase": "B_bpmn",
            "bpmn_dir": str(bpmn_dir),
            "project_root": str(project_root),
            "resolve_services": args.resolve_services,
            "counts": total_counts,
        },
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Stage 2 Phase B: wrote {out_path}")
    print(f"  BPMN files: {total_counts['files']}")
    print(f"  Processes (flow nodes): {total_counts['processes']}")
    print(f"  userTasks: {total_counts['user_tasks']}, serviceTasks: {total_counts['service_tasks']}, gateways: {total_counts['exclusive_gateways'] + total_counts['parallel_gateways']}")
    print(f"  sequenceFlows: {total_counts['sequence_flows']}")
    if args.resolve_services:
        print(f"  service beans resolved: {total_counts['service_beans_resolved']} / {total_counts['service_beans_found']} found")
    print(f"  Output size: {out_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
