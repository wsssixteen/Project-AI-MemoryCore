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
        col = a.colors.get("stroke") or a.colors.get("fill")   # RGB 0-1 tuple
        print(pno+1, a.type[1], "colour:", col, repr(a.info.get("content","")),
              "under-rect:", repr(doc[pno].get_textbox(a.rect).strip()))
```

Capture per annotation: page · type · **colour** · `content` (the comment body) · the text under its rect. Write the full list into `QA-NNNN.md` as a `## BA PDF Annotations` section.

### 🚦 Highlight colour + un-commented highlights — what is a REQUEST vs an OK-mark (added 2026-06-10 per みや, QA-262004)

A BA highlight is **not automatically a fix request.** Two filters before treating any highlight as scope:

| Signal | Meaning | Action |
|---|---|---|
| **GREEN highlight** (stroke ≈ `(0, 1, 0)` / green-ish) | BA's "verified OK / this is correct" marker | **IGNORE — never a requirement.** Do NOT trace or fix it. |
| Highlight with a **comment** (FreeText / popup text) | the comment IS the ask | act on the comment's instruction |
| Highlight with **NO comment** (`content==''`), non-green | an emphasis mark, ambiguous | **NOT a request by itself** — surface as BA-Q or pair it with the nearest commented annotation; do NOT invent a fix from it |

**Banned**: turning an un-commented highlight (or worse, a green one) into a code/template change. **Why** (QA-262004 2026-06-10): I saw an un-commented highlight sitting on a lowercase "jalan tandang", decided it meant "make it proper case", and changed a **shared** populator for it — BA never wrote that ask (the only comment in that area was "KM tu jadi", about spacing). みや: *"I didn't see BA requesting me... ignore green."* Fix only what BA highlighted **AND** asked for (cross-ref `feedback_ticket_cadence` "fix only BA-highlighted items"). When a highlight has no comment, its colour + nearest comment decide whether it is scope at all.

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
