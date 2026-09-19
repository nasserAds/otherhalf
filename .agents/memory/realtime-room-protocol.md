---
name: Realtime room protocol
description: Non-obvious sequencing rules for voice peer discovery and room chat hydration.
---

Voice participants must enter the server-side voice peer set only after a local microphone stream exists. The newly mic-enabled client initiates WebRTC calls from the active-peer list; existing peers should not create competing offers when they receive a peer-joined notification.

**Why:** Mic-off clients creating empty WebRTC offers caused negotiation failures, and chat appeared empty after refresh or route entry when only live messages were broadcast.

**How to apply:** Keep voice join/leave tied to the mic lifecycle, queue ICE candidates until a remote description exists, and send recent room chat history immediately after a successful room join.

The browser-facing preview must use the frontend's same-origin `/api/backend` proxy rather than a hardcoded LAN address or direct backend port. Socket.IO is intentionally pinned to polling in this environment because the preview does not reliably forward websocket upgrades.

**Why:** The backend was reachable from the workspace shell, but two remote browsers could not reach the old LAN URL, and websocket-only connections timed out through the preview proxy.

**How to apply:** Keep REST and Socket.IO on the proxied frontend origin, and require clients to reload after transport configuration changes.

Voice listening is independent from microphone capture. A client joins the voice mesh as a recv-only peer on room entry; microphone permission only adds an outgoing audio track. Remote audio playback still needs one user gesture on browsers that enforce autoplay policy, so keep a visible listen/unmute control.

**Why:** Requiring `getUserMedia` before joining meant users could not hear a speaker unless they granted microphone access, and mobile browsers can block a remote `<audio>` element until the user interacts with the page.

**How to apply:** Keep voice join/leave tied to room membership, keep mic state tied only to outgoing tracks, and apply per-user mute locally to each remote audio element.