---
name: reference_rustdesk_server
description: "RustDesk 'Not ready' on the work laptop PJNBRidhwan: his own server on the home laptop, reached by the name ridhwanhome.duckdns.org (fixed 2026-11-03); first check the home laptop is on and the DuckDNS task runs; domain/remote-access-check prints it at every session start; AnyDesk is the way in"
metadata:
  type: reference
---

🚨 **It is HIS OWN server (hbbs + hbbr), set up on his home laptop (his words 2026-11-02), never a company server: never tell him to message infra about it.**

**Root cause, verified 2026-11-03:** the home internet line changed its public address (202.186.75.193 → 202.184.39.249) and the work laptop still dialled the old one. Seen 2026-10-23 and 2026-10-31 to 2026-11-03.

**Fix in place 2026-11-03:**
- Both RustDesk clients (work + home) set ID server = `ridhwanhome.duckdns.org`, relay and API empty, key unchanged.
- Home laptop: scheduled task `DuckDNS` (every 5 min, SYSTEM) calls the DuckDNS update URL, so the name follows the new address. DuckDNS account wsssixteen@github, domain ridhwanhome. The token is his: never ask him to paste it in chat.
- Verified from the work laptop: name resolves to 202.184.39.249, ports 21116 and 21117 open; home showed Ready.

**If Not ready again, in order:** (1) home laptop off, asleep or restarted with the server stopped; (2) DuckDNS task not running or token wrong (`Invoke-RestMethod` the update URL: OK good, KO bad token); (3) router port forward points at a home local IP that DHCP changed; (4) router lost NAT loopback (home only: hosts file `127.0.0.1 ridhwanhome.duckdns.org`).

**Check:** `node domain/remote-access-check/remote-access-check.js`. It reads the server from the RustDesk config, so it follows the name. It runs at every session start on this laptop. The shell here is not elevated.

**Sessions here run ON the work laptop.** Never write "from here" as if I were remote. Related: [[user_career_vision]].
