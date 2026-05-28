---
name: etanah-rahsia-bypass
description: Use when applying or removing rahsia-bypass patches on etanah-common — for signature generation, OTP bypass, biometric ID bypass at the rahsia gate. Triggers — "skip rahsia gate", "skip the rahsia gate", "bypass OTP", "bypass biometric", "biometric identification", "generate signature", "generate signature for testing", "to peraku", "to perform signature", "apply rahsia bypass", "remove rahsia bypass", "enable rahsia bypass", "disable rahsia bypass", "restore from .bak", "did we undo the hack", "did we undo the hack properly". Pairs with `etanah-knowledge/melaka/DEV-TESTING-HACKS.md`.
allowed-tools: Bash, Read, Write, Edit, Grep
---

# etanah-rahsia-bypass — safe apply + restore cycle for etanah-common rahsia-gate patches

## The Iron Law

```
NO "APPLIED" OR "RESTORED" CLAIM WITHOUT POST-WRITE VERIFICATION
```

Every apply step MUST be followed by zip-integrity + size-sanity + expected-change-count assertions. Every restore step MUST be followed by size-match + MD5-match + integrity assertions against the backup. If any assertion fails → the file is in UNKNOWN STATE; do NOT claim done; surface to みや.

**Violating the letter of this rule is violating the spirit of this rule.**

## ⛔ Purpose — this bypass EXISTS because OTP / Pengesahan is unusable in dev/test

**NEVER suggest "just complete the OTP / Pengesahan / biometric" as an alternative to this bypass.** In the local dev/test environment the OTP/biometric Pengesahan infra is NOT available to the tester — the OTP goes to a real gov email / biometric device the tester does not control. **みや got stuck there for HOURS** before this bypass existed. The entire reason this skill exists is that pengesahan is a dead end in test. If you catch yourself about to say *"try the OTP/Pengesahan first"* — **STOP. That is the banned suggestion this skill replaces.** (Added 2026-05-28 after I re-suggested OTP and wasted みや's time — QA-262495. Two methods now exist: the .m2-war patch below, and the safer EXPLODED-DEPLOYMENT single-file patch — see `DEV-TESTING-HACKS.md` "EXPLODED-DEPLOYMENT variant".)

## Why this exists (2026-05-25 trigger)

The rahsia-gate hack on `etanah-common-0.0.647-MLK.war` was applied during QA-261986 testing. Diary entry + standing flag both claimed "restored from backup at Phase 1 close — local JBoss now sees the un-hacked war." On 2026-05-25 the WAR was on-disk **CORRUPTED** (57 MB partial-write vs 92 MB backup; invalid zip; not loadable by Maven). The restore was never executed OR was interrupted; the close-claim went unverified. The corruption broke today's JBoss deployment (POST_MODULE phase failed; Hibernate classes unreachable) until manual recovery from `.bak_qa261986`.

This skill makes that slip impossible by gating both directions of the cycle with deterministic verification.

## Process

### Apply phase

**Step 1 — Inventory the target**

| Field | Source |
|---|---|
| Target file (absolute path) | User-provided OR derived from active quest |
| Original size (bytes) | `stat -c%s <target>` BEFORE backup |
| Original MD5 | `md5sum <target>` |
| Expected change pattern + count | Per hack-specific entry in `etanah-knowledge/melaka/DEV-TESTING-HACKS.md`. Example: "23 → 0 `failRahsiaPreviewId` references after rahsia-gate bypass" |

**Step 2 — Backup BEFORE any mutation**

```bash
# Atomic OS copy — backup name must include date + reason
cp "<target>" "<target>.bak_<YYYY-MM-DD>_<short-reason>"
```

Verify backup is INTACT before continuing:
```bash
md5sum "<target>" "<target>.bak_<date>_<reason>"  # must match
unzip -tq "<target>.bak_<date>_<reason>"           # must succeed
```

If MD5 mismatch OR unzip fails → ABORT. The original was already broken; don't compound.

**Step 3 — Apply patch via atomic-write**

For zip-style archives (WAR / JAR), use Python's zipfile + `os.replace` atomic swap:

```python
import zipfile, os, shutil, sys
src = r"<target>"
tmp = src + ".tmp_new"

# Read all entries, mutate the targeted ones, write to tmp
with zipfile.ZipFile(src, 'r') as zin:
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.endswith('.class') and <patch_predicate>:
                data = <patched_bytes>(data)
            zout.writestr(info, data)

# Atomic swap — never leaves a partial-write in place
os.replace(tmp, src)
```

**Banned**: in-place mutation of the original zip (the failure mode that produced today's 57MB partial). ALWAYS write to `.tmp_new` first; atomic-swap last.

**Step 4 — MANDATORY post-write verification gate**

```bash
new_size=$(stat -c%s "<target>")
bak_size=$(stat -c%s "<target>.bak_<date>_<reason>")

# Size sanity — flag >10% drift in either direction
drift=$(awk "BEGIN {print ($new_size - $bak_size) / $bak_size * 100}")
echo "size drift: $drift%"  # must be within ±10%

# Zip integrity — must show "No errors detected"
unzip -tq "<target>"

# Expected-change-count assertion
tmp=$(mktemp -d) && unzip -q "<target>" -d "$tmp"
actual_count=$(grep -r "<pattern>" "$tmp" | wc -l)
rm -rf "$tmp"
echo "expected: <N> remaining, actual: $actual_count"  # must match the per-hack spec
```

**ALL three must pass.** If any fails → restore from backup immediately, surface to みや with the failure detail. Do NOT claim "applied" until all three are green.

**Step 5 — Document in DEV-TESTING-HACKS.md**

Append (or update existing entry for this hack) at `etanah-knowledge/melaka/DEV-TESTING-HACKS.md`:
- Target file (full path + version)
- Date applied
- Change description (1-line)
- Backup path
- Expected-change-count (e.g. "23 → 0")
- Restore command (the EXACT `cp` to run later)

### Restore phase

**Step 6 — Restore via atomic copy**

```bash
cp "<target>.bak_<date>_<reason>" "<target>"
```

**Step 7 — MANDATORY post-restore verification gate**

```bash
# Size match
[ "$(stat -c%s <target>)" = "$(stat -c%s <target>.bak_<date>_<reason>)" ] || echo "FAIL: size mismatch"

# MD5 match
md5sum "<target>" "<target>.bak_<date>_<reason>"  # both hashes must be identical

# Zip integrity
unzip -tq "<target>"

# Expected-change-count back to original
tmp=$(mktemp -d) && unzip -q "<target>" -d "$tmp"
restored_count=$(grep -r "<pattern>" "$tmp" | wc -l)
rm -rf "$tmp"
echo "expected: <original-N>, actual: $restored_count"  # must match pre-hack count
```

**ALL FOUR must pass.** If any fails → file is in unknown state; do NOT claim restored; surface to みや with which check failed.

**Step 8 — Backup cleanup**

Do NOT delete the `.bak_<date>_<reason>` immediately after restore. Cleanup fires at Phase 1 commit-prep per `quest-protocol.md` "Phase 1 close-out backup-file cleanup" rule. If the same file is mutated multiple times in one session, keep ONLY the latest pre-edit backup (per quest-protocol "Backup-on-mutation" failsafe).

If the .bak is >7 days old at cleanup time, surface to みや before deleting (it may be a deliberate long-term preserve).

## Red Flags — STOP if you catch yourself thinking

- "It looks fine, the size is roughly right, I'll skip the integrity check" — the 2026-05-25 corruption was a 38% size shrink that 'looked fine' visually
- "I'll claim restored, can verify later" — that's exactly the silent-claim-drift that left the WAR broken for 3 days
- "MD5 check is paranoid for a 92MB file" — MD5 mismatch is what caught today's slip; non-negotiable
- "The .bak proves we have a safety net, so a partial write is recoverable" — recoverable yes, but the claim of "restored" while the file was actually corrupted broke today's JBoss for hours
- "Backup deletion can happen after testing for tidiness" — backups outlive the testing cycle; clean ONLY at Phase 1 commit-prep
- About to use in-place zip mutation (no `.tmp_new` + `os.replace`) — banned; produces the 2026-05-25 failure mode
- About to claim "applied" or "restored" without all assertion gates green

**ALL of these mean: STOP. Run the verification gate. Re-emit claim only if green.**

## Excuse | Reality

| Excuse | Reality |
|---|---|
| "Size is close enough" | 2026-05-25 slip was 38% shrink; eyeballed-fine ≠ verified-fine |
| "MD5 is overkill for a war file" | The MD5 mismatch IS what surfaced the slip today; the prose rule before didn't |
| "I'll skip verify, the cp command can't fail" | cp can fail on disk-full, network-mount-glitch, OneDrive-sync-race. Verify is the only proof |
| "Backup is the safety net, no need to verify the restore" | Safety net catches the FALL — but if you claim "restored" and the file is still bad, you don't fall, you ship a broken state |
| "DEV-TESTING-HACKS.md is just documentation, can skip" | The doc IS the restore-command source-of-truth. Without it, future sessions guess. The 2026-05-25 slip happened partly because the procedure was never written down |
| "23 → 0 reference count check is too specific" | That assertion would have caught the 2026-05-25 partial-write immediately — invalid zip can't be unzipped, so grep returns 0 (false-positive "all references removed") — the check forces unzip success first |

## When this skill fires

Trigger phrases — `apply the rahsia bypass`, `remove the rahsia bypass`, `skip OTP`, `skip the rahsia gate`, `bypass the signature gate`, `to peraku`, `to perform signature`, `patch the war for testing`, `restore from .bak`, `did we undo the hack`, `enable the testing hack`, `disable the testing hack`, `binary patch cycle`, `testing-only patch`, `apply class-file hack`.

Use BEFORE running the patch/restore — the skill IS the gate, not a post-hoc audit.

## Pairs with

- `personality.md` "Word .docx action-scope" — sister pattern for .docx; this skill generalizes to WAR/JAR/zip
- `quest-protocol.md` "Backup-on-mutation" — already MANDATORY; this skill operationalizes the verification side
- `quest-protocol.md` "Phase 1 close-out backup-file cleanup" — owns the .bak removal timing
- `claim-verification` skill — restore claim is a "done" claim; diff-backing means showing the size/MD5/integrity check output
- `etanah-knowledge/melaka/DEV-TESTING-HACKS.md` — per-hack catalog with exact commands

## History

- **2026-05-25** (morning) — Created as `dev-testing-hack` in response to the rahsia-gate restore-claim slip surfaced during JBoss deployment investigation. The 0.0.647-MLK.war was 57MB partial-write for 3 days while the standing flag claimed "restored." Knowledge file `DEV-TESTING-HACKS.md` created alongside as the per-hack registry.
- **2026-05-25** (same day, refined) — **Renamed `dev-testing-hack` → `etanah-rahsia-bypass`** per みや's correction: the actual use case is etanah-common rahsia-bypass for signature generation + OTP + biometric ID at the rahsia gate; "dev-testing-hack" was too generic. Description rewritten <500 chars, removed workflow summary (Anthropic best-practice), added explicit triggers for "generate signature", "bypass OTP", "bypass biometric", "biometric identification". Refine ran through formal `system-design` Skill-tool invocation (Steps 0-6) + wording-shape audit per `auto-skill-on-mistake` Step 3.6b — the missed step at original creation.
