---
name: Simplify means subtract — reference working examples in mature systems
description: Mature codebase → find a working analog FIRST. When みや says simplify, the next diff must SHRINK. Scrutinize AI-generated code, never trust as reference.
type: feedback
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
---
**Rule**: Etanah is a mature system — most patterns are already solved somewhere. Before adding any new fix, find the closest working analog (urusan/tugasan combination) that solves a similar problem and read its config + code path. Match the existing shape. When みや asks to "simplify" or says the implementation is "too much," the next iteration's diff MUST shrink — fewer files, fewer lines. If you're adding code after a simplify feedback, you're misreading the feedback.

**Why:** During QA #258022 (3 sessions, 2026-04-28 → 2026-04-29), みや repeatedly told me:
- "This is a mature system — things are catered for"
- "Refer to other working urusans/tugasans"
- "The implementation is too much"
- "Simplify"
- "Scrutinize Codex's changes — don't just refer to them"

I ignored every one of those signals. Each iteration ADDED more code instead of removing it. Final accounting:
- Attempt 1: wrong tugasan codes (SB4CE) + wrong bean — broken
- Attempt 2: extended `tugasanSMB_ALL` with Lite codes (without reading what `smb_all` option_type rendered → caused FAT failure with Tindakan Seterusnya pollution); added 2 redundant Java fixes (Fix 2 in BaseLiteForm.initData, Fix 3 in 4Ce.initEditModeBorang); added TGSN_*_ALL constants; rewrote onChangeTindakanKeputusan dispatch — all scope creep
- Attempt 3 rework: reverted everything Java, created `smb_utiliti` option_type
- Final fix: 1 file, +19/-1 lines

The fix should have been 1 file from day 1. The existing handler chain in master already covered Lite SMB correctly — the bug was a single missing config entry. Three days were burned because I kept adding fixes instead of looking for the minimal one in the existing patterns.

**How to apply:**

1. **Reference before writing** — for any fix, find an existing working (urusan + tugasan) entry in the relevant config (`tindakan.config.json`, `tugasan.config.json`, etc.) that solves a similar shape. Read its `option_type` definition. Read the code path it triggers. Verify your fix follows the same structure. **Do not invent new option_types or new constants when proven ones exist.**

2. **Simplify means SUBTRACT** — when みや says "this is too much" or "simplify" or "you're over-doing it":
   - The next response must show what was REMOVED, not what was added
   - Diff size goes DOWN, not up
   - If you can't find something to remove, ask みや what specifically he wants removed before adding anything
   - Win condition: fewer files modified, fewer lines, less surface area

3. **Scrutinize, don't trust generated code** — Codex / Cursor / other AI-generated code is a STARTING POINT, not a reference of truth. Walk every line:
   - Are tugasan codes correct? Verify against actual application data via SQL (entity-first rule from CLAUDE.md)
   - Are option_types extended correctly? Read the option_type definition before adding to its `included_urusan_list`
   - Is the field being set on the right object? Check for shadowing (Java fields are not virtual — see QA #258022 4Ce private adaPegawaiAgih)
   - Has someone else fixed this already? `git pull` and check before writing parallel work

4. **For mature-system bugs specifically** — assume the framework already handles your case until proven otherwise. Search for working examples first. The bug is usually:
   - Missing config entry (not missing code)
   - Wrong code in a config entry's `included_urusan_list`
   - Pointing at the wrong option_type
   The fix is rarely "add new Java." The Java is usually already there.

**Concrete example — QA #258022:**
- Symptom: Pembetulan + Agihan Kepada don't render for Lite SMB
- Root cause: missing `tugasan_list` entry in `tindakan.config.json` for Lite + SMB
- The complete fix: 1 new tugasan_list entry + 1 new option_type definition + remove Lite from wrong existing entry
- What I added that was unnecessary: 4 Java file modifications, all reverted
- Time cost: 3 days vs. the 1 day this should have taken

**Self-check trigger**: every time I'm about to add a Java fix to a JSF/PrimeFaces ticket, ask: "Is there a working analog in the config that solves this same shape? Have I read its option_type definition? Has anyone already done this in a recent commit?" If I haven't checked, I haven't earned the Java change.

5. **Team-lead's literal fix-shape instruction is the default starting point** (added 2026-05-20 after QA-262370 Option-A miss): When the assigning senior (Aaron, BA-prep journal, Pull Request reviewer, etc.) literally names the fix file or fix layer in their handoff note, that IS the working analog — start there. Deviating to a different fix-shape requires an EXPLICIT business-logic justification stronger than "safer / more reversible / smaller surface" — those are aesthetic preferences, not evidence. **Why** (2026-05-20 QA-262370): Aaron's journal said *"as long as you adjust in suratHeader docx. should fix for all"*. I chose Java-side per-pejabat image-dimension swap instead (Option A), framed as "safer/reversible". The fix had no visible effect because the visible issue is structural (table-cell position in `HeaderSurat.docx` word/header2.xml), not image-dimension. Aaron's instruction was the correct knob; my deviation cost みや a full rebuild+redeploy+test cycle. **How to apply**: when emitting Recon's "Fix-shape candidates" surface, the senior-named option is Option-A-by-default. Other options listed for completeness, but the chosen one defaults to senior's lean unless a Recon-evidence row directly contradicts the senior's chosen layer.

   **5a. `.docx` editing — programmatic is a normal default tool** (revised 2026-05-21 by みや — supersedes the 2026-05-20 "Word UI default" framing, which made Ruri stop unnecessarily and hand work back): Programmatic `.docx` XML editing is a **normal, first-class tool** — single-file structural edits included (adding/retagging Content Controls, run-text edits, alignment, fonts). Do NOT default to handing `.docx` work back to みや or to Word UI.

   **Mandatory discipline on every programmatic `.docx` edit:**
   1. **Check the `~$<name>.docx` lock file first** — if it exists, the file is open in Word; do NOT script it (concurrent edits collide — QA-262004 P50). Ask みや to close it.
   2. **Back up first** — copy to a safe place (Ruri's `outputs-temp/`, not the etanah repo where `.bak` files get cleaned).
   3. **Validate after** — XML well-formed (`ElementTree.fromstring`), zip integrity (`testzip()`), balanced `<w:sdt>`/`</w:sdt>` + `</w:p>` counts vs the backup. If validation fails → restore the backup.

   The QA-262370 lesson IS this validate-+-lock discipline — it is NOT "avoid programmatic / default to Word UI / hand back to みや". QA-262370's real failure was authoring a complex NEW structure (7-column text-box/vMerge grid) blind, plus a concurrent-edit collision — both caught by the discipline above.

   **Banned**: emitting a "QA-262370 caution" / "QA-262370 trap" framing in chat; stopping or deferring doable `.docx` work to みや citing QA-262370. Word UI is みや's choice when HE asks for it — never Ruri's default deferral.

   **Why** (2026-05-21 みや): *"It hinders our workflow when you stop unnecessarily."* The QA-262004 session ran 5 programmatic `.docx` edit scripts (CC inserts, retagging, dedup, CC re-creation) — every one validated clean — proving programmatic single-file `.docx` editing is safe with the discipline above. Bulk multi-file `.docx` surgery is equally fine — same discipline.
