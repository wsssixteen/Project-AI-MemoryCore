---
name: reference_rustdesk_server
description: "RustDesk 'Not ready' on the work laptop PJNBRidhwan: test the company ID server 202.186.75.193 ports first; domain/remote-access-check prints it at every session start; AnyDesk is the way in"
metadata:
  type: reference
---

RustDesk on PJNBRidhwan registers with the company ID server 202.186.75.193 (TCP 21116, relay 21117, API 21114). Who runs the server is not recorded.

**Seen twice:** 2026-10-23 (21116 closed, came back by itself; a PJ HQ firewall maintenance was announced for 6:30 to 7:30 PM that evening) and 2026-10-31 to 2026-11-01 (21114-21119 time out from this laptop and from 6 Malaysian networks; ping answers; a control server answers from the same probes; a reboot did not help). His home laptop still showed green; why is not verified.

**2026-11-02 findings:** still down. TCP 21114-21119, 22, 80, 443 time out and UDP 21116 gives no answer to a real RustDesk register message, while the same message to rs-ny.rustdesk.com answers. Traceroute reaches the address and it answers ping, so the fault is at or behind that address, not on this laptop. The address is on a TT Dotcom line; "company server" is not proven and the owner is still unknown. No infra notice about it in WhatsApp from 30 Oct to 2 Nov. On 23 Oct the Wi-Fi dropped at 6:39 PM inside the maintenance window, so that outage may have been the office side only. Untested: whether the server answers the home network. Port open from home = it filters by source address; closed = it is down and the green dot is stale.

**Check:** `node domain/remote-access-check/remote-access-check.js`. It runs at every session start on this laptop. The shell here is not elevated, so the RustDesk service log and config cannot be read or changed.

**Sessions here run ON the work laptop.** Never write "from here" as if I were remote, and never assume he is remote: this session's start says which machine it is. Related: [[user_career_vision]].
