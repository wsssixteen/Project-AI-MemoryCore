# DEV-TESTING-HACKS.md — eTanah testing-only patches catalog

> **Purpose**: Per-hack registry of testing-only patches applied to eTanah binary artifacts (WAR / JAR / class files inside archives). Each entry MUST include: target file (full path + version), change description, expected-change-count assertion, exact apply + restore commands.
>
> **Companion skill**: `.claude/skills/dev-testing-hack/SKILL.md` — enforces the safety pattern. Read its Iron Law before any apply/restore cycle.
>
> **Background** (2026-05-25): Created in response to the rahsia-gate restore-claim slip — the 0.0.647-MLK.war was on-disk corrupted for 3 days while the standing flag claimed "restored." This file now holds the procedure-of-record; the skill enforces verification at apply + restore.

---

## Active hacks (currently NOT applied)

*(When a hack is currently APPLIED — i.e. the patched version is in the cache — move its entry above this line and add a `**APPLIED**` marker with date. When restored, move back below and add a `**Last restored**` marker. This makes the on/off state visible at a glance.)*

---

## Hack catalog

### Rahsia-gate bypass (Risalat MMKN rahsia-doc preview / peraku)

| Field | Value |
|---|---|
| **Trigger phrases** | "to peraku", "to perform signature", "rahsia gate", "skip OTP for testing", "bypass rahsia gate" |
| **Target file** | `E:\Dev\.m2_etanah\my\gov\etanah\etanah-common\0.0.647-MLK\etanah-common-0.0.647-MLK.war` |
| **Why** | The Risalat MMKN rahsia-doc preview + peraku button is gated by an OTP/password challenge (`failRahsiaPreviewId` checks at 23 sites inside the WAR). For local testing, bypassing the gate saves manual OTP entry per click — useful during repeat-test cycles. **Never ships** — this is testing-only. |
| **Change** | No-op the `failRahsiaPreviewId` checks inside the compiled `.class` files in the WAR. The button renders without challenging the user. |
| **Reference count** | Pre-hack: **23** `failRahsiaPreviewId` references in the WAR. Post-hack: **0** (all sites bypassed). |
| **Original (un-hacked) MD5** | `fadad1f6eb4e4a50b70067134b1de381` |
| **Original (un-hacked) size** | 92,201,293 bytes (~92 MB) |

#### Apply procedure

```powershell
# 1. INVENTORY — capture pre-state
$TARGET = "E:\Dev\.m2_etanah\my\gov\etanah\etanah-common\0.0.647-MLK\etanah-common-0.0.647-MLK.war"
$BACKUP = "$TARGET.bak_$(Get-Date -Format yyyy-MM-dd)_rahsia-gate"
$pre_size = (Get-Item $TARGET).Length
$pre_md5  = (Get-FileHash -Algorithm MD5 $TARGET).Hash
Write-Host "pre size=$pre_size md5=$pre_md5"

# 2. BACKUP BEFORE MUTATION — atomic copy
Copy-Item $TARGET $BACKUP
# Verify backup integrity (must succeed before any mutation)
& "C:\Program Files\7-Zip\7z.exe" t $BACKUP > $null
if ($LASTEXITCODE -ne 0) { throw "Backup integrity check FAILED — abort" }
```

```python
# 3. APPLY PATCH — atomic write via tmp + os.replace
import zipfile, os, sys

TARGET = r"E:\Dev\.m2_etanah\my\gov\etanah\etanah-common\0.0.647-MLK\etanah-common-0.0.647-MLK.war"
TMP    = TARGET + ".tmp_new"

# Pattern bytes to no-op: the bytecode sequence that calls failRahsiaPreviewId.
# (Exact bytes depend on which version's compilation — verify per-version.)
# Conceptually: replace the conditional branch + method call with NOP bytes that
# preserve method length so constant-pool offsets stay valid.

# NEVER do in-place mutation. ALWAYS write to TMP then os.replace.
with zipfile.ZipFile(TARGET, 'r') as zin:
    with zipfile.ZipFile(TMP, 'w', zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.endswith('.class'):
                # Patch logic: scan for the byte pattern, replace with NOP-equivalent.
                # ...
                pass
            zout.writestr(info, data)

os.replace(TMP, TARGET)  # atomic — never leaves partial-write
print("patch written")
```

```powershell
# 4. MANDATORY POST-APPLY VERIFICATION GATE
# (a) Size sanity — drift expected near-zero since we're just NOP-ing bytecode
$post_size = (Get-Item $TARGET).Length
$drift_pct = [math]::Round(($post_size - $pre_size) / $pre_size * 100, 2)
Write-Host "post size=$post_size drift=$drift_pct%"
if ([math]::Abs($drift_pct) -gt 10) { throw "Size drift > 10% — likely corruption. RESTORE from backup." }

# (b) Zip integrity
& "C:\Program Files\7-Zip\7z.exe" t $TARGET > $null
if ($LASTEXITCODE -ne 0) { throw "Zip integrity FAILED — RESTORE from backup" }

# (c) Expected-change-count — must be 0 post-patch
$tmp_extract = New-TemporaryFile | %{ Remove-Item $_; New-Item -ItemType Directory -Path $_.FullName -Force }
& "C:\Program Files\7-Zip\7z.exe" x -o"$($tmp_extract.FullName)" $TARGET > $null
$count = (Select-String -Path "$($tmp_extract.FullName)\**\*" -Pattern 'failRahsiaPreviewId' -SimpleMatch -ErrorAction SilentlyContinue | Measure-Object).Count
Remove-Item -Recurse -Force $tmp_extract.FullName
Write-Host "failRahsiaPreviewId references post-patch: $count (expected 0)"
if ($count -ne 0) { throw "Expected-change-count FAILED — RESTORE from backup" }

Write-Host "[APPLIED] rahsia-gate bypass on 0.0.647-MLK.war"
```

#### Restore procedure

```powershell
$TARGET = "E:\Dev\.m2_etanah\my\gov\etanah\etanah-common\0.0.647-MLK\etanah-common-0.0.647-MLK.war"
# Use the actual backup filename written at apply time:
$BACKUP = (Get-ChildItem "$TARGET.bak_*_rahsia-gate" | Select-Object -First 1).FullName

# 1. ATOMIC COPY — backup over current
Copy-Item $BACKUP $TARGET -Force

# 2. MANDATORY POST-RESTORE VERIFICATION GATE
# (a) Size match
$cur_size = (Get-Item $TARGET).Length
$bak_size = (Get-Item $BACKUP).Length
if ($cur_size -ne $bak_size) { throw "Size mismatch — restore FAILED" }

# (b) MD5 match
$cur_md5 = (Get-FileHash -Algorithm MD5 $TARGET).Hash
$bak_md5 = (Get-FileHash -Algorithm MD5 $BACKUP).Hash
if ($cur_md5 -ne $bak_md5) { throw "MD5 mismatch — restore FAILED" }

# (c) Zip integrity
& "C:\Program Files\7-Zip\7z.exe" t $TARGET > $null
if ($LASTEXITCODE -ne 0) { throw "Zip integrity FAILED" }

# (d) Reference count must be back to 23
$tmp_extract = New-TemporaryFile | %{ Remove-Item $_; New-Item -ItemType Directory -Path $_.FullName -Force }
& "C:\Program Files\7-Zip\7z.exe" x -o"$($tmp_extract.FullName)" $TARGET > $null
$count = (Select-String -Path "$($tmp_extract.FullName)\**\*" -Pattern 'failRahsiaPreviewId' -SimpleMatch -ErrorAction SilentlyContinue | Measure-Object).Count
Remove-Item -Recurse -Force $tmp_extract.FullName
if ($count -ne 23) { throw "Reference count $count != 23 — restore likely incomplete" }

Write-Host "[RESTORED] rahsia-gate intact on 0.0.647-MLK.war — 23 failRahsiaPreviewId refs, MD5 matches backup"
```

#### Restore-cleanup (at Phase 1 commit-prep, NOT immediately after)

```powershell
Remove-Item "$TARGET.bak_*_rahsia-gate"
```

Per `quest-protocol.md` "Phase 1 close-out backup-file cleanup" — cleanup fires during prepare-commit sequence, not post-push. If the .bak is >7 days old, surface to みや before deleting.

#### History

| Date | Event |
|---|---|
| 2026-05-22 ~20:36 | Hack applied to 0.0.647-MLK.war for QA-261986 testing. Backup written as `.bak_qa261986`. |
| ~2026-05-23 | Phase 1 close diary entry claimed "restored from backup at Phase 1 close" — **claim was NOT diff-backed**. |
| 2026-05-25 | JBoss deployment failed in POST_MODULE phase (NoClassDefFoundError on `org.hibernate.HibernateException`). Investigation revealed the WAR was 57 MB (partial-write) vs 92 MB backup — restore was never properly executed. **Real restore performed**: `cp .bak_qa261986 → current`, verified by size + MD5 + 23-ref-count + zip integrity. WAR confirmed un-hacked. JBoss-fail root cause cleared. |

---

## Format for adding new hacks

Each new hack MUST follow this section structure:
1. **Header**: hack name + 1-line description
2. **Field table**: target file · why · change · reference count (pre/post) · original MD5 · original size
3. **Apply procedure** (PowerShell or python — atomic-write only)
4. **Verification gate** (size / integrity / change-count)
5. **Restore procedure** (atomic copy + verification gate)
6. **Cleanup** (at commit-prep, not earlier)
7. **History** (apply / restore events with date)

NEVER add a hack here without writing the restore procedure. NEVER claim "applied" or "restored" without the verification gate.

---

*Created 2026-05-25 in response to rahsia-gate restore-claim slip. Companion to `.claude/skills/dev-testing-hack/SKILL.md` (Layer 3 — Capabilities). This file lives in Layer 4 (Knowledge) — etanah-specific per-hack procedures.*
