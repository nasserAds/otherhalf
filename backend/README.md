# OtherHalf Backend — Phase 4

NestJS + Prisma + PostgreSQL + Socket.IO backend for the debate game.

## Setup

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

Server listens on `PORT` (default 4000). REST base path: `/`. Sockets share
the same origin/port (default Socket.IO namespace).

## Auth flow (no passwords, per the product brief)

1. `POST /auth/register { username, avatar }` → returns `{ accessToken, deviceSecret, user }`.
   The client must store `deviceSecret` locally (e.g. localStorage) — it is
   only ever returned once.
2. `POST /auth/login { username, deviceSecret }` → returns a fresh `accessToken`.
3. REST calls: `Authorization: Bearer <accessToken>`.
4. Socket connections: pass the token as `io(url, { auth: { token } })`.

## Gameplay depth additions (topic voting + predictions)

`GameService.startMatch` now runs in two stages instead of creating a Match
immediately:

1. **Topic vote** (new, in-memory only — no schema change): debaters are
   picked, 3 candidate topics are drawn, and the room gets `TOPIC_VOTE_SECONDS`
   (12s) to vote via `game:topicVoteCast`. Live counts broadcast on
   `game:topicVoteUpdate`; a per-second `game:topicVoteTick` drives the
   countdown, matching the server-authoritative pattern used everywhere else.
   Ties (including "nobody voted") are broken randomly.
2. **Match creation** (`beginMatch`, the old `startMatch` body) runs once the
   vote resolves, using whichever topic won.

**Predictions** (`audience:predict` / `VotingService.castPrediction`) already
existed at the service layer since Phase 4 but had no visible payoff — the
`results:winnerAnnounced` payload now includes `correctPredictorIds` so the
frontend can show "you called it" without a second round-trip.

## Bugfix pass (post-launch reports)

1. **Room cleanup / host transfer**: `RoomsService.leaveRoom` previously only
   checked for an empty room *when the host* left, and only marked the room
   `CLOSED` rather than deleting it. Rewritten around a shared
   `handleDeparture` used by both `leaveRoom` and the new `kickPlayer` —
   runs for *any* departure, transfers host if anyone else is online, and
   now actually `DELETE`s the room (cascades to `RoomPlayer`/`Match`/
   `ChatMessage`) when it becomes empty.
2. **Host transfer never firing in practice**: the Lobby's back button
   was plain client-side navigation with no `room:leave` emitted, so the
   server had no idea the host was gone until a real socket disconnect —
   fixed on the frontend (see its README), but flagged here since it looks
   like a backend bug from the outside.
3. **Public room list**: `listPublicRooms` returned `_count.players` while
   the frontend expected a full `players` array — a real shape mismatch
   that would throw at render time. Now returns `host: {username, avatar}`
   plus `_count.players`, matching a new frontend type built for this
   endpoint specifically.
4. **Kick player** (`lobby:kickPlayer`) and **room settings** (`lobby:updateSettings`,
   max players / debate mode / visibility) are new, host-only, both
   re-validated server-side via `assertIsHost` — never trust the client's
   idea of who's host.

## Module map

- `auth` — register/login, JWT issuing + verification
- `users` — profile, XP history
- `rooms` — create/join/leave, room codes, public room listing, presence + reconnect-grace socket gateway
- `lobby` — ready toggle, chat, host-gated match start
- `topics` — random topic selection with no-repeat-until-exhausted logic
- `game` — the authoritative match state machine (phase timers, turn submission) + live-match gateway (turns, reactions, votes, predictions)
- `voting` — vote/prediction persistence, tallying, resolution
- `xp` — the only place XP/coins are awarded, always via an auditable ledger row

## Known limitations / things to revisit in later phases

- **Match timers are in-memory** (`setInterval` per active match on a single
  process). Fine for one backend instance; if you ever run multiple
  instances behind a load balancer, this needs to move to a shared
  scheduler (e.g. a Redis-backed queue) so a match doesn't "stick" on one
  node.
- **Voice mode** has no server-side implementation yet — `debateMode` is
  stored and validated, but the actual WebRTC/voice transport is deferred to
  Phase 6 per the Phase 1 plan.
- **Reconnect grace period** is a flat 30s constant (`RECONNECT_GRACE_MS` in
  `rooms.gateway.ts`) — fine for a v1, but not configurable per room yet.
- This code has **not been run** — the sandbox this was written in has no
  network access, so `npm install` / `prisma generate` / a real compile pass
  couldn't be executed here. I reviewed every relation, DTO, and module
  import by hand, but please run `npm install && npx prisma generate` and a
  `tsc --noEmit` pass before treating this as final.
