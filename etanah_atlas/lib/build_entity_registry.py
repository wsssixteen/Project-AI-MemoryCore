"""Build build/entity_registry.json: entity FQCN -> DB table, from the compiled etanah-domain jar.
Reads @javax.persistence.Table(name=...) via javap in chunks. Authoritative source: the jar the
pelupusan WAR actually ships (target/.../WEB-INF/lib/etanah-domain-*.jar).
Usage: python lib/build_entity_registry.py [jar_path]"""
import json, pathlib, re, subprocess, sys, tempfile, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
JAVAP = r"C:\Program Files\Java\jdk-17\bin\javap.exe"
DEFAULT_JAR = r"E:\Projects\Melaka\etanah-pelupusan\target\etanah-pelupusan\WEB-INF\lib\etanah-domain-1.0.4-MLK.jar"

def main(jar_path):
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="etdomain_"))
    with zipfile.ZipFile(jar_path) as z:
        names = [n for n in z.namelist() if n.endswith(".class") and n.startswith("my/gov/etanah/domain/") and "$" not in n]
        z.extractall(tmp, members=names)
    print(f"classes to scan: {len(names)}", file=sys.stderr)
    registry = {}
    CHUNK = 120
    for i in range(0, len(names), CHUNK):
        chunk = names[i:i+CHUNK]
        fqcns = [n[:-6].replace("/", ".") for n in chunk]
        out = subprocess.run([JAVAP, "-v", "-p", "-cp", str(tmp)] + fqcns,
                             capture_output=True, text=True, encoding="utf-8", errors="replace")
        # javap -v prints per-class sections; split on "public class"/"class" header lines w/ fqcn
        text = out.stdout
        sections = re.split(r"\nClassfile ", text)
        for sec in sections:
            mcls = re.search(r"^(?:public\s+)?(?:abstract\s+)?(?:final\s+)?(?:class|interface|enum)\s+([\w.]+)", sec, re.MULTILINE)
            if not mcls:
                continue
            fq = mcls.group(1)
            if not fq.startswith("my.gov.etanah.domain"):
                continue
            mtab = re.search(r"javax\.persistence\.Table\(\s*\n\s*name=\"([^\"]+)\"", sec)
            if mtab:
                registry[fq] = mtab.group(1).lower()
    out_path = ROOT / "build" / "entity_registry.json"
    json.dump({"jar": str(jar_path), "count": len(registry), "entities": registry},
              open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"entities with @Table: {len(registry)} -> {out_path}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_JAR)
