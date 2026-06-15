---
name: feedback-comment-style
description: "Short in-code comment style validated by みや QA-260508 — name actual variable names + plain English + cross-reference, no jargon abstractions"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d3f2c27e-f5be-49d2-b889-0996616ddac7
---

In-code comment style that lands for みや (validated on QA-260508 2026-06-12, "VERY VERY good format now").

**The rule**: short comments (max 2 lines) that NAME the actual variable names and use plain English between them. NO jargon abstractions ("popup VO", "the check below passes", "data flow"); NO "this/that" without specifics; NO ceremony.

**🚨 Hard rule (QA-264293 2026-06-15): NEVER rewrite, expand, or "improve" みや's own in-code comments.** When editing near a comment he wrote, leave it **verbatim**. His short plain phrasing IS the standard; my rewrites drift robotic + jargon-filled. He reverted my overwrite of his `// 4Ae/L1e "Dikeluarkan" date only on successful sign, otherwise blank` and said: *"DO NOT alter my comments. yours was too robotic & filled with jargons."* If I must add a comment, add my own short one — never touch his.

**Why**: みや 2026-06-12 — *"Why can't you explain just through naming the variable combined with normal human speak?"* Variable names ARE the technical anchor; the surrounding words are just plain English connecting them. Aaron / future readers don't need to decode internal abstractions to know what's happening.

**How to apply**:

- **Lead with ticket# when applicable** (`QA-260508:`), then the action verb
- **Name the actual variables** as they appear in code (`popupPremiumVO`, `premium`, `denda`, `this.denda`) — never "the VO" / "the field" / "the popup data"
- **Use plain English between them** for what the code does + the consequence ("Without this, denda is null at the if-check and the save gets blocked with 'Sila kemaskini maklumat tanah'")
- **Cross-reference other locations by literal address** ("Remove if line 173 is fixed" / "workaround in performCustomSave") — never abstract ("see related code")
- **Max 2 lines**; if more is needed, restructure (or it doesn't belong in a comment)
- **Banned**: "popup VO" / "the check below passes" / "validation logic" / "data flow" / "the bean fields" / "the VO instance" — these are abstractions, not names

**Canonical examples** (from QA-260508, validated):

```java
// QA-260508: copy popupPremiumVO into premium, tetap, sementara, denda before the if-check below.
// Without this, denda is null at the if-check and the save gets blocked with "Sila kemaskini maklumat tanah". Remove if line 173 is fixed.
```

```java
// this.denda never loads. Popup when performing Simpan. workaround in performCustomSave.
```

**Cross-ref**: pairs with [[feedback_no_extra_comments]] (no commented-out original code, max 1 line per non-obvious WHY) and the project's `feedback_simplify_and_reference.md` "name what you see, not what it means" principle. This memory specifies the *shape* of those non-obvious WHY comments.
