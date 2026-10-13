# NUKE-MARKER — save-quest-gate

| Field | Value |
|---|---|
| Created  | 2026-10-06 |
| Session  | 2026-10-06 miya: saying "close quest" started the close skill only when the assistant noticed the words; domain/save-quest had a script and no hook |
| Files    | domain/save-quest-gate/save-quest-gate.check.hook.js · eval.js · README.md · NUKE-MARKER.md · log.jsonl · domain/bundles/upsm-mode.json child entry · system/registry.jsonl line |
| Rollback | 1 `Remove-Item -Recurse -Force domain\save-quest-gate` · 2 `node -e "const fs=require('fs');const f='domain/bundles/upsm-mode.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j.children=j.children.filter(c=>!c.includes('save-quest-gate'));fs.writeFileSync(f,JSON.stringify(j,null,2))"` · 3 `node -e "const fs=require('fs');const f='system/registry.jsonl';fs.writeFileSync(f,fs.readFileSync(f,'utf8').split('\n').filter(l=>!l.includes('\"name\":\"save-quest-gate\"')).join('\n'))"` · 4 or `git revert <birth-SHA>` |
| Retire   | 2026-11-05 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
