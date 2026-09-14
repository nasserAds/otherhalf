# OtherHalf — a multi-game platform

Started as a single browser multiplayer debate game; restructured as a small
game platform: **Login → Games Hub → pick a game → play**. OtherHalf (the debate
game) is the first title; the hub is built so adding a second is additive,
not a rewrite (see `frontend/lib/games.ts`).

Full stack: Next.js frontend + NestJS/Prisma/PostgreSQL/Socket.IO backend.

## Structure

```
otherhalf-project/
├─ backend/     NestJS API + Socket.IO gateways + Prisma schema
├─ frontend/    Next.js app — Games Hub, OtherHalf (rooms/lobby/game), voice chat
└─ docs/        Phase 1 planning doc + Phase 2 interactive design mockup
```

## Running it locally

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev           # http://localhost:4000
```

**2. Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                 # http://localhost:3000
```

Each subfolder has its own README with more detail (module map, screen map,
what's real vs. what's flagged as a known limitation).

## Latest bugfix pass

Five issues reported and fixed this round — full detail in each project's
own README, short version here:

1. **Mic — players couldn't hear each other.** Two real bugs: a broken
   WebRTC signaling protocol (mic-off users were reacting to join events
   and sending empty offers that poisoned negotiation), and voice state
   being destroyed/rebuilt every time you navigated from the Lobby to the
   Game screen. Both fixed — see `frontend/README.md`.
2. **Host leaving didn't transfer the crown, and empty rooms stuck around.**
   The backend only checked for an empty room when the *host* left, and
   only marked it `CLOSED` instead of deleting it. The Lobby's back button
   also wasn't telling the server the player was leaving at all. Both fixed
   — rooms are now genuinely deleted (not just closed) once empty, from any
   departure path.
3. **Couldn't log back in with an existing username on the same device.**
   Logout was deleting the only credential that can re-authenticate that
   account (there's no password, by design) — a single logout permanently
   locked people out. Fixed.
4. **Chat messages weren't appearing.** The Lobby's chat panel never
   actually rendered a message list — only ever showed the latest message
   as input placeholder text. Rewritten to show real, visible history above
   the input bar, in both the Lobby and the Game screen.
5. **Public room list + host controls.** The public list now shows the
   host's name/avatar instead of the room code (and fixes a real
   frontend/backend type mismatch in the process). Hosts can now kick
   players and change room settings (max players, debate mode,
   public/private) from a new panel in the Lobby.

## Navigation flow

```
/  (splash)
 → /login or /register → /avatar
 → /menu                          Games Hub — cover card per game
    → /games/otherhalf            OtherHalf's own menu (Create/Join Room)
       → /room/create             → /room/[code]/lobby → /room/[code]/game
       → /room/join               → /room/[code]/lobby → /room/[code]/game
    → /games/<future-slug>        placeholder for the next game
 → /settings                      reachable from the hub's gear icon
```

Both the Lobby and the Game screen have a labeled chat panel and, when the
room's debate mode allows it, a mic toggle — text chat and voice chat are
fully independent (separate hooks, no shared state), so players can type
and talk at the same time.

Starting a match opens a short **topic vote** (3 candidates, live bars)
before the debate begins, and non-debaters get one shot at **predicting the
winner** during the prep phase, with a payoff on the Winner screen if they
called it right.

## What's built so far

| Phase | Status |
|---|---|
| 1 — Product Planning | ✅ `docs/phase-1-product-planning.md` |
| 2 — UI/UX Design | ✅ `docs/phase-2-ui-ux-design.html` (clickable mockup) |
| 3 — Database | ✅ `backend/prisma/schema.prisma` |
| 4 — Backend | ✅ `backend/` |
| 5 — Frontend | ✅ `frontend/` |
| 6 — Realtime | ✅ presence/lobby/game/votes/results + voice chat + in-game chat |
| Games Hub | ✅ platform restructure — OtherHalf is now one game among a growing list |
| 7 — Polish | ✅ synthesized sound effects, crossfade transitions, loading states, memoization, accessibility pass |
| Gameplay depth | ✅ pre-match topic voting + audience predictions with a Winner-screen payoff |
| Bugfix pass | ✅ mic, host transfer/room cleanup, login, chat visibility, host controls — see above |
| 8 — Testing | Not started |

## Known limitations

- **Not run/compiled** — this was all built without network access, so
  `npm install` and a real build have not happened. Please run
  `npm install && npx tsc --noEmit` (frontend) and the equivalent in the
  backend before treating either as final. This applies doubly to the
  WebRTC voice fix — the protocol logic was corrected by careful code
  tracing, not by running two real browsers against each other, so please
  test it with two actual devices before shipping.
- **Match state is in-memory** on both ends — a backend restart or a hard
  frontend refresh mid-match loses live match state (also true of an
  in-progress topic vote, which is entirely in-memory by design).
- **Voice chat is mesh WebRTC**, fine for small groups, no TURN server
  configured (STUN only) — some users behind strict NATs still won't
  connect; that's a separate, known gap from the bug just fixed.
- **Only one real game exists** (OtherHalf) — the hub shows two "coming soon"
  placeholder covers to establish the platform shape.
- **No music track shipped** — the music-volume slider is wired and
  persisted but silent until an actual track is added.
