# render-verify — a template/render fix is not finished until the RENDERED output is proven

**Why (miya 2026-08-20, #276181)**: the font "Arial 11" fix on the PPTPB Pemilik Berdaftar block was declared fixed and delivered as a deploy card **three times** — (1) template `docDefaults` sz=22, (2) template placeholder run sz=22, (3) the VO `setFontSize(FONT_SIZE_11)` code fix — and every time the generated document still rendered **12pt**, because the actual RENDERED output was never inspected. Compile-green and "the code is correct" are not proof. Only the generated `.docx` is.

## The rule

A **template (.docx)** edit or a **document-render** change (`populate*` / `WordStyleVO` / `WordEditorUtil` / `FONT_SIZE_` / content control) does **not** count as delivered/finished until the rendered output is verified from an **actual generated document**:

> unzip the generated `.docx` → read `word/document.xml` → confirm the target run's `sz` / font / text.

## Pieces

| Piece | Role |
|---|---|
| `render-verify.check.hook.js` | Stop hook, **BLOCK**. Fires when a delivery/finished hand-back (deploy card · `BA re-test` · `counts as finished` · `delivered`) mentions a template/render change but carries no `RENDER-VERIFY:` line. |
| `render-verify.eval.js` | 6 fixtures (clean · replay-blocks · verify-passes · non-render-silent · no-delivery-silent · bypass) — 6/6 green 2026-08-20. |

## Satisfy the gate

Emit one line proving the inspection:

```
RENDER-VERIFY: <doc/permohonan> · unzipped word/document.xml · <tag> run sz=<N> (<pt>pt) ✓ · font=<Arial> ✓
```

- `sz` is in half-points: `sz=22` = 11pt, `sz=24` = 12pt.
- If the render is only producible server-side and you have **not** inspected it yet, you have **not** finished — say so plainly and bypass with the reason: `[skip-render-verify: awaiting BA regen on the new build]`. Never a bare "done".

*Born 2026-08-20 via core/forge.js (registry row `render-verify`).*
