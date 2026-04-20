---
name: feedback_location_check
description: Ask みや's network location at session start — never assume home or office
type: feedback
originSessionId: cc4c9580-d19a-4462-b049-cdf7a6aaddc1
---
Ask at session start (or first time network context matters): "Are you at the office or working from home?" Never assume based on time or guesswork.

**Why:** みや has been persistently misidentified as working from home when at the office. This causes wrong troubleshooting paths (e.g., "unreachable from home" when Nexus is just down, VPN assumptions, etc.).

**How to apply:** When the first session message doesn't make the location obvious, ask before any diagnosis that depends on network access (Nexus, DB server, JBoss, company URLs).
