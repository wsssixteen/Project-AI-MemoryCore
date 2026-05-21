---
name: annotations
description: Extract every annotation layer from BA-provided files before trusting them — PDF Annot objects (FreeText comments, highlights, sticky notes), Word .docx review comments, and SDT alias/tag metadata. Trigger at Quest Phase 0 / before Recon, or manually with "check annotations", "read the annotations", "extract annotations", "did you check the annotations", whenever a .pdf or .docx is in a ticket's 0. Brief/.
---

# annotations — Extract every annotation layer

## Purpose

BA feedback files carry instructions in layers the default Read tool does NOT surface:

| File type | Hidden layer | Where it lives |
|---|---|---|
| `.pdf` | `Annot` objects — FreeText comment bodies, highlight comments, sticky notes, ink | NOT in the rendered page view; only via `fitz` (PyMuPDF) |
| `.docx` | Word review comments | `word/comments.xml` — NOT in `word/document.xml` |
| `.docx` | Content Control metadata | each SDT's `<w:tag>`, `<w:alias>`, placeholder text |

The BA writes the actual answers — which CC tag `<xxx>` to use, "align ke kiri", expected values — inside these layers. Reading the rendered view and thinking "I've seen the annotations" is the recurring slip (QA #259318, QA-260302, QA-262004).

## When it fires

- **Quest Phase 0** — for every `.pdf` / `.docx` in the ticket's `0. Brief/`.
- **Hard precondition of Recon emit** (amendment A14) — Recon is BANNED until every `0. Brief/` PDF's annotations are extracted into `QA-NNNN.md`.
- Manual — the trigger phrases in the description.

## Steps

### PDF annotations (fitz)

```python
import fitz
doc = fitz.open(pdf_path)
for pno in range(doc.page_count):
    for a in (doc[pno].annots() or []):
        print(pno+1, a.type[1], repr(a.info.get("content","")),
              "under-rect:", repr(doc[pno].get_textbox(a.rect).strip()))
```

Capture per annotation: page · type · `content` (the comment body) · the text under its rect. Write the full list into `QA-NNNN.md` as a `## BA PDF Annotations` section.

### Word .docx comments + Content Controls

```python
import zipfile, re
z = zipfile.ZipFile(docx_path)
# review comments
if 'word/comments.xml' in z.namelist():
    cx = z.read('word/comments.xml').decode('utf-8')
    # each <w:comment> -> w:id, w:author, joined <w:t> text
# SDT metadata
doc = z.read('word/document.xml').decode('utf-8')
for s in re.findall(r'<w:sdt>.*?</w:sdt>', doc, re.S):
    tag   = re.search(r'<w:tag w:val="([^"]*)"', s)
    alias = re.search(r'<w:alias w:val="([^"]*)"', s)
    # also read placeholder / inner <w:t> text
```

Report tag + alias + placeholder text per SDT; report every review comment with author + anchor.

## Negative test

Skip if the ticket has no `.pdf` / `.docx` in `0. Brief/`. Do not invent an annotations section for a text-only ticket.

## Hook

Not cleanly hookable — "Phase 0 with a PDF present" is not a deterministic harness event. Enforced instead as a **Recon precondition** (amendment A14): `QA-NNNN.md` must contain the annotations section before the Recon block is emitted. The `verify` skill checks for it.

## Why this is a skill, not prose

The CLAUDE.md hard rule "PDF annotation extraction at Phase 0" (2026-05-04) was prose and slipped repeatedly — the rendered PDF view looks complete, creating false confidence. A named skill with discoverable triggers + the A14 precondition gate is the deterministic form.

## Lifecycle

- **v1 (now)** — manual + Phase-0 fire; confirmation before acting per Step 5b.
- Refinement reviewed after ≥3 quest cycles.

---
*Created 2026-05-21 by Ruri (みや asked) — converts the prose PDF-annotation rule into a skill after the QA-262004 annotation-skip slip. Tier 3, lowercase-hyphenated.*
