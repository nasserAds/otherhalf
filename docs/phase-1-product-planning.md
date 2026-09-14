# Phase 1 — Product Planning
### Browser Multiplayer Debate Game (Arabic, RTL)

---

## 1. Game Concept

**Elevator pitch:** Two players get thrown into a live 1v1 debate on a topic neither of them picked, arguing sides they didn't choose. An audience of other room members watches, reacts, predicts the winner, and votes at the end. It plays like a party game crossed with a mini esports match — fast rounds, big reveal, XP and bragging rights.

**Core loop (per match):**
1. Room fills up in the Lobby → Host starts the game
2. System randomly picks 2 debaters from the room
3. System assigns a topic + opposite stances
4. Debate plays out in structured rounds (text and/or voice)
5. Audience predicts + reacts during the debate
6. Voting phase → Winner Screen with XP/coin payout
7. Room loops back to Lobby for the next match (new pair, new topic)

**Session shape:** One "room" can run many consecutive matches without players leaving — this keeps the multiplayer session alive rather than being a single-round game, similar to Kahoot/Jackbox-style repeat play.

**Room size:** Recommended 4–12 players (2 debaters + up to 10 audience). Host sets the max at room creation.

**Session length per match:** ~3–5 minutes (prep + 2 rounds + final statement + voting), configurable by host later if needed.

---

## 2. Core Gameplay

### Round structure
| Phase | Duration (suggested) | Who acts | Notes |
|---|---|---|---|
| Preparation | 20–30s | Both debaters | See topic + stance privately, silent prep, no audience visibility into their notes |
| Round One | 45–60s each | Debater A, then B | Opening argument |
| Round Two | 30–45s each | Debater A, then B | Rebuttal |
| Final Statement | 20–30s each | Debater A, then B | Closing line |
| Voting | 15–20s | Audience | Vote for A or B |
| Winner Reveal | ~5s animation | — | Confetti + XP payout |

Turn order alternates who goes first each match (fairness).

### Topic generation
- Curated topic bank stored server-side (categories: fun/light, hypothetical, everyday-life, pop-culture — kept non-political/non-sensitive to match the fun "game" tone, not a real-world debate club).
- Server picks a topic at random (or filtered by category if host sets one), assigns **Stance A** and **Stance B** as opposites, and locks both to their debaters — debaters cannot swap.
- No repeats within the same room session until the bank is exhausted, then reshuffle.

### Voting mechanics
- Only audience members (not the 2 debaters) can vote.
- One vote per player per match, cannot change after submission.
- Votes are hidden until the Winner Screen (prevents bandwagon voting).
- Tie handling: system falls back to prediction accuracy or picks randomly with a clear "draw" animation — exact tie-break rule to be finalized in Phase 3/4.

### Audience interaction
- **React**: emoji burst overlay, purely cosmetic, no gameplay effect, rate-limited to avoid spam.
- **Predict**: before/at debate start, audience privately predicts who wins — resolved at Winner Screen, correct guess = +5 XP.
- **Vote**: at Voting Phase, decides the actual winner.
- Audience cannot type into or interrupt the debate itself — chat is separate and always available in the Lobby, and optionally muted/limited during live rounds to keep focus on the debaters.

### Debate modes (host-selected at room creation)
- **Text**: turn-based text input with a visible countdown per turn.
- **Voice**: WebRTC/voice-room style speaking turns (implementation detail deferred to Phase 6, but the room record needs the mode flag from Phase 3 onward).
- **Text + Voice**: both channels open simultaneously.

---

## 3. User Flow

```
New user
  → Splash Screen
  → Register (username + avatar pick)
  → Main Menu

Returning user
  → Splash Screen
  → Login (username, or persisted session)
  → Main Menu

From Main Menu
  → Create Room  → Lobby (as Host)
  → Join Room    → enter code → Lobby (as Player)
  → Settings     → adjust audio/theme → back to Main Menu

In Lobby
  → Players ready up → Host starts match
  → Game Screen (only if selected as one of the 2 debaters)
  → Audience view (everyone else, watching + reacting + predicting)
  → Voting Screen
  → Winner Screen
  → back to Lobby (loop for next match, or leave room → Main Menu)
```

---

## 4. Screen Flow / Navigation Map

```
[Splash] 
   │
   ▼
[Login] ──(no account)──► [Register] ──► [Avatar Selection] ──┐
   │                                                            │
   └────────────────────────────────────────────────────────────┘
   ▼
[Main Menu] ──┬──► [Create Room] ──► [Lobby]
              ├──► [Join Room]   ──► [Lobby]
              └──► [Settings]

[Lobby] ──(host starts)──► [Game Screen] ──► [Voting Screen] ──► [Winner Screen]
   ▲                                                                   │
   └───────────────────────────────────────────────────────────────────┘
                (loop to next match, same room)

[Lobby] ──(leave room)──► [Main Menu]
```

**Screen inventory (11 total):** Splash, Login, Register, Avatar Selection, Main Menu, Create Room, Join Room, Lobby, Game Screen, Voting Screen, Winner Screen, Settings.
(Note: that's 12 listed — Settings is reachable both from Main Menu and mid-game, treated as one shared screen/modal.)

**Game Screen sub-states** (same route, different UI state driven by socket events): `preparing → round1 → round2 → final → voting → winner`. This avoids a separate route per phase and keeps transitions animatable within one screen.

---

## 5. Technical Architecture

### High-level system diagram
```
┌─────────────┐        HTTPS (REST, JWT)        ┌─────────────┐
│   Next.js    │ ───────────────────────────────► │   NestJS     │
│   Frontend   │ ◄─────────────────────────────── │   Backend    │
│              │                                   │              │
│              │        WSS (Socket.IO)            │              │
│              │ ◄────────────────────────────────►│              │
└─────────────┘                                   └──────┬───────┘
                                                          │
                                                   ┌──────▼───────┐
                                                   │  PostgreSQL  │
                                                   │  (Prisma)    │
                                                   └──────────────┘
```

### Frontend (Next.js + TypeScript)
- **Rendering:** App Router, mostly client-rendered for game screens (real-time state), server-rendered/static for Splash/Login shell.
- **State management:** Zustand (or Context+Reducer) for room/game state synced from Socket.IO events — kept separate from React Query, which handles REST calls (auth, profile, room metadata).
- **Styling:** Tailwind CSS with a small design-token layer (colors, spacing, radii) so the "game" look stays consistent — detailed in Phase 2.
- **Animation:** Framer Motion for screen transitions, card flips, countdown pulses, winner confetti.
- **RTL:** Root layout sets `dir="rtl"` and `lang="ar"`; all spacing/flex direction must be logically-aware (`ms-`/`me-` over `ml-`/`mr-`) to avoid mirrored-icon bugs.
- **Realtime client:** a single Socket.IO client instance wrapped in a provider, exposing typed event hooks (e.g. `useRoomSocket()`, `useGameSocket()`).

### Backend (NestJS + TypeScript)
- **Modules (initial cut, refined in Phase 4):** `AuthModule`, `UsersModule`, `RoomsModule`, `LobbyModule`, `GameModule`, `VotingModule`, `TopicsModule`, `XpModule`, `GatewayModule` (Socket.IO gateways).
- **Layering:** Controller (REST) / Gateway (WS) → Service (business logic) → Repository via Prisma → PostgreSQL. Keeps gameplay logic out of the transport layer so both REST and sockets can reuse it.
- **Validation:** class-validator DTOs on both REST bodies and inbound socket payloads.
- **Auth guard:** JWT verified on REST via Nest Guards; on WS via a handshake middleware that attaches the authenticated user to the socket before allowing room events.

### Realtime (Socket.IO)
- One Socket.IO server, namespaced logically (`/rooms`) with **Socket.IO rooms** = one per game room (using the 6-char room code as the Socket.IO room name).
- Server is the single source of truth for game state (current phase, timers, votes) — clients only render what the server emits, preventing desync/cheating on timers or vote counts.
- Full event catalog defined in section 7 below and finalized in Phase 6.

### Authentication (JWT)
- Lightweight account: username + avatar only, no email/password — so likely a device/session-based signup issuing a JWT immediately on Register, refreshed via a refresh token or long-lived access token stored httpOnly.
- JWT payload: `userId`, `username` — kept minimal; XP/coins/stats always fetched fresh, never trusted from the token.

### Infra (placeholder, not decided yet)
- Postgres + Node backend can be containerized together; frontend deployed separately (e.g., Vercel-style) with the backend's WSS/HTTPS URL as an env var. Finalized in Phase 8 (deployment guide).

---

## 6. Database Planning (Entity Overview)

*(Conceptual only — full Prisma schema with fields/indexes comes in Phase 3.)*

**Entities:**
- **User** — account, avatar, XP, coins, wins, losses
- **Room** — code, visibility (public/private), max players, debate mode, status, host reference
- **RoomPlayer** — join table: user ↔ room, with role (host/player), ready state, online state
- **Match** — one debate instance within a room (so a room can have many matches over its lifetime)
- **Round** — the individual turns within a match (prep/round1/round2/final), tied to a Match
- **Topic** — topic bank entry (text, category, the two opposite stances)
- **Vote** — audience member ↔ match, which debater they voted for
- **Prediction** — audience member ↔ match, predicted winner, resolved boolean
- **XpTransaction** — ledger of XP/coin awards (winner/loser/correct prediction) tied to a user + match, so totals are auditable rather than just incremented blindly
- **Statistics** — aggregate/denormalized view (wins/losses/XP) for fast profile lookups, derived from the above

**Key relationships:**
- User 1—N RoomPlayer N—1 Room
- Room 1—N Match
- Match 1—N Round
- Match 2 (debaters) —N Vote / N Prediction (from audience Users)
- Match N—1 Topic
- User 1—N XpTransaction

---

## 7. Socket Architecture (Event Catalog)

*(Names are proposed conventions — finalized in Phase 6.)*

### Connection / Presence
- `room:join`, `room:leave`, `room:reconnect`
- `presence:online`, `presence:offline`

### Lobby
- `lobby:playerJoined`, `lobby:playerLeft`
- `lobby:readyToggle` → `lobby:playerReadyChanged`
- `lobby:hostTransferred`
- `lobby:chatMessage`
- `lobby:startMatch` (host-only trigger)

### Game / Match
- `game:matchStarted` (payload: debaters, topic, stances)
- `game:phaseChanged` (prep → round1 → round2 → final → voting → winner)
- `game:timerTick`
- `game:turnSubmitted` (text mode)
- `game:voiceTurnStarted` / `game:voiceTurnEnded` (voice mode)

### Audience
- `audience:react`
- `audience:predict`

### Voting / Results
- `voting:castVote`
- `voting:closed`
- `results:winnerAnnounced` (payload: winner, vote split, XP awarded)

### Reconnect Handling
- On disconnect: player marked "offline" in room state, grace-period timer starts server-side.
- On reconnect within grace period: full state resync emitted (`room:stateSync`) so the client can rebuild UI without a full reload.
- If grace period expires mid-match: debater disconnect triggers an auto-forfeit/pause rule (exact behavior to confirm in Phase 6); audience disconnect just removes them from vote eligibility.

---

## 8. Folder Structure

### Frontend (Next.js)
```
frontend/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  └─ register/
│  ├─ (main)/
│  │  ├─ menu/
│  │  ├─ settings/
│  ├─ room/
│  │  ├─ create/
│  │  ├─ join/
│  │  └─ [code]/
│  │     ├─ lobby/
│  │     └─ game/
│  └─ layout.tsx        (sets dir="rtl", lang="ar", fonts)
├─ components/
│  ├─ ui/                (buttons, cards, inputs — design-system primitives)
│  ├─ game/               (debate card, timer ring, vote bar, winner confetti)
│  ├─ lobby/              (player list, ready button, chat)
│  └─ layout/
├─ hooks/
│  ├─ useRoomSocket.ts
│  ├─ useGameSocket.ts
│  └─ useAuth.ts
├─ store/                 (Zustand slices: user, room, game)
├─ lib/                   (socket client, api client, constants)
├─ styles/                (tailwind config, tokens)
└─ types/                 (shared TS types, mirrors backend DTOs)
```

### Backend (NestJS)
```
backend/
├─ src/
│  ├─ auth/
│  │  ├─ auth.controller.ts
│  │  ├─ auth.service.ts
│  │  └─ jwt.strategy.ts
│  ├─ users/
│  ├─ rooms/
│  │  ├─ rooms.controller.ts
│  │  ├─ rooms.service.ts
│  │  └─ rooms.gateway.ts
│  ├─ lobby/
│  │  └─ lobby.gateway.ts
│  ├─ game/
│  │  ├─ game.service.ts       (round/phase state machine)
│  │  └─ game.gateway.ts
│  ├─ voting/
│  ├─ topics/
│  ├─ xp/
│  ├─ common/                  (guards, pipes, filters, decorators)
│  └─ prisma/
│     └─ prisma.service.ts
├─ prisma/
│  └─ schema.prisma
└─ test/
```

---

## Open Questions for You Before Phase 2

1. **Topic bank size/tone** — how many starter topics, and should Phase 1's "fun/light, non-political" framing be the final rule, or do you want a serious-debate mode too?
2. **Voice mode scope** — full WebRTC voice in-app, or is a lighter "speaking indicator + external voice chat" acceptable for v1?
3. **Reconnect/forfeit rule** — what should happen if a debater disconnects mid-match (auto-forfeit vs. pause-and-wait)?

These don't block Phase 2 (UI/UX Design) — flagging them now so they don't surprise us later.

---

**This concludes Phase 1.** Let me know if you'd like any changes, or say "approved" / "continue" to move to Phase 2 — UI/UX Design.
