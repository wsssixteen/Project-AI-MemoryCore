---
name: Writer-before-reader rule
description: When a parser/reader sees wrong or missing state, audit the writer that produced the input before touching the reader
type: feedback
originSessionId: 903879e2-8b51-485b-9c2a-3ee89145a5d6
---
When a parser, reader, or downstream consumer sees wrong/missing/corrupt state, my first move is to find and audit the code that *produced* the input — not to patch the reader.

**Why:** QA #256113 (2026-04-14) — the symptom was `findTableByContentControlTag` returning empty on pass 2. I spent hours theorizing about reader branches (missing `instanceof Tc`, `JAXBElement<Tr>`, etc.) and wrote a refactor. The actual defect was 80 lines above in the same file: `insertContentControlTableInDocument` writes a `Tbl` into a `CTSdtContentRow` on pass 1, which is schema-invalid — docx4j marshals it anyway, JAXB silently drops it on reload, reader sees empty content. The fix was in the writer. I never looked there because I was fixated on the reader.

**How to apply:** Whenever the symptom is "X can't find/parse/handle the data it received", do NOT start by reading X. Start by finding the code that wrote the data X is consuming, and verify that code produced legal/valid output. If the writer is correct, only then investigate the reader. This applies to: serializers/deserializers, file I/O, database round-trips, message queues, cache layers, XML/JSON round-trips, and anywhere data crosses a save-load boundary.
