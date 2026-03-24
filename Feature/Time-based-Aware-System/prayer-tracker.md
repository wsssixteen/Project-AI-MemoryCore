# Prayer Tracker
*Daily prayer reminder state — resets each day*

## Prayer Windows (Malaysia Average)
| Prayer | Window Start | Window End | Approx Prayer Time |
|---|---|---|---|
| Subuh | 5:00 AM | 6:30 AM | ~5:45 AM |
| Zohor | 12:00 PM | 1:30 PM | ~1:15 PM |
| Asar | 3:00 PM | 4:30 PM | ~4:15 PM |
| Maghrib | 6:00 PM | 7:30 PM | ~7:15 PM |
| Isyak | 8:00 PM | 9:30 PM | ~8:30 PM |

## Today's State
**Date**: 2026-03-24
| Prayer | Status |
|---|---|
| Subuh | - |
| Zohor | - |
| Asar | - |
| Maghrib | - |
| Isyak | - |

## How It Works
1. Cron runs every 10 min during active sessions
2. Checks current time against prayer windows above
3. Two phases per prayer:
   - **Prep phase** (before prayer time): "want to get ready?" — can't pray yet
   - **Prayer phase** (after prayer time enters): "have you prayed?" — can pray now
4. When Miya says "prayed" / "done" / acknowledges → status updated to "done"
5. Outside all windows → cron stays silent (saves resources)
6. State resets each new day

## Acknowledgment Phrases
- "prayed", "done praying", "alhamdulillah", "dah solat", "sudah solat"
