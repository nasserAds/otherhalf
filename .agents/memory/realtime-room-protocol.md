---
name: Realtime room protocol
description: Non-obvious sequencing rules for voice peer discovery and room chat hydration.
---

Voice participants must enter the server-side voice peer set only after a local microphone stream exists. The newly mic-enabled client initiates WebRTC calls from the active-peer list; existing peers should not create competing offers when they receive a peer-joined notification.

**Why:** Mic-off clients creating empty WebRTC offers caused negotiation failures, and chat appeared empty after refresh or route entry when only live messages were broadcast.

**How to apply:** Keep voice join/leave tied to the mic lifecycle, queue ICE candidates until a remote description exists, and send recent room chat history immediately after a successful room join.