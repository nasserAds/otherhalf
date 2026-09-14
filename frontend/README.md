# OtherHalf Frontend — Phase 6

Next.js (App Router) + TypeScript + Tailwind + Framer Motion, matching the
Phase 2 design system exactly (same color tokens, radii, shadows, and the
"Duel Ring" signature element), now fully wired to the Phase 4 backend over
both REST and Socket.IO.

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your running Phase 4 backend
npm run dev
```

Requires the Phase 4 backend running (default `http://localhost:4000`).

## Screen map

| Route | Screen |
|---|---|
| `/` | Splash (attempts silent login, then redirects) |
| `/login` | Login |
| `/register` → `/avatar` | Register (2 steps: username, then avatar) |
| `/menu` | **Games Hub** — cover cards for every game (see `lib/games.ts`) |
| `/games/[slug]` | Per-game landing menu — `otherhalf` shows Create/Join Room |
| `/room/create` | Create Room (OtherHalf) |
| `/room/join` | Join Room (OtherHalf) |
| `/room/[code]/lobby` | Lobby (OtherHalf) |
| `/room/[code]/game` | Game / Voting / Winner (OtherHalf) |
| `/settings` | Settings |

### Adding a second game

The app is now structured as a small platform, not a single game:

1. Add an entry to `lib/games.ts` (slug, title, tagline, player count).
2. It automatically appears as a cover card on the Games Hub.
3. Build out `app/games/[slug]/page.tsx`'s branch for that slug (currently
   only `otherhalf` is implemented; anything else redirects back to the hub).
4. Give the new game its own routes/components under `app/` and
   `components/`, following the same pattern as `room/`, `components/game/`,
   `components/lobby/` — none of that is OtherHalf-specific by name, but nothing
   currently enforces namespacing either, so keep new games' files clearly
   named to avoid collisions as more are added.

## What's wired (Phase 6 — realtime)

Everything below is now driven by actual Socket.IO events from the Phase 4
backend, not local/demo state:

- **Lobby**: joining/leaving, presence (online/offline dots), ready-status
  toggling, host transfer, chat — all via `hooks/useRoomSocket.ts`, which
  also re-joins automatically on reconnect.
- **Match start**: the host's "بدء" button just emits `lobby:startMatch`;
  every player (including the host) actually enters the Game screen when
  the server broadcasts `game:matchStarted`, not from a direct navigation.
- **Game screen**: phase changes, the countdown ring, turn submission (for
  whoever's actually speaking), live audience reactions, and voting are all
  driven by `hooks/useGameSocket.ts`. Votes stay hidden (no live tally)
  until `results:winnerAnnounced` arrives, matching the "no bandwagon
  voting" design decision from Phase 4.
- **Reconnect handling**: `components/ui/ConnectionBanner.tsx` shows a
  subtle "reconnecting..." pill whenever the socket drops, and the room is
  automatically re-joined once it's back — pairing with the backend's 30s
  grace-period window before a disconnect counts as a real departure.
- **Draw handling**: the Phase 1 open question is now resolved in the UI —
  a tied vote shows a dedicated "تعادل" (draw) state with both avatars
  highlighted, instead of forcing a single winner.

## Gameplay depth (topic voting + predictions)

- **Topic Vote screen**: after the host starts a match, everyone sees a new
  pre-match screen — 3 candidate topics, live vote bars, a countdown ring.
  Whichever topic wins becomes the match's topic. This is a genuinely new
  phase (`useGameStore().topicVote`), not part of the `MatchPhase` enum,
  since the Match row doesn't exist yet at this point.
- **Prediction panel**: shown once, during `PREPARING`, to everyone except
  the two debaters (they can't predict their own match). Wired to the
  `castPrediction` action that already existed in `useGameSocket` since
  Phase 6 but had no UI.
- **Winner screen payoff**: shows "🎯 توقعك كان صحيحًا! +5 XP" if you
  predicted correctly — reads `result.correctPredictorIds`, a new field on
  the results payload.

## Bugfix pass (post-launch reports)

1. **Mic — players couldn't hear each other.** Root cause: `useVoiceChat`'s
   old protocol had *every* listening client (mic-on or not) react to
   `voice:peerJoined` by creating a peer connection. A mic-off user reacting
   this way created a connection with zero local tracks, producing a
   degenerate SDP offer with no media — which then poisoned that pair's
   negotiation even after they later turned their mic on. Rewritten so only
   the newly-joined (mic-on) user ever initiates outbound calls, using the
   `voice:activePeers` list the server already sent but the frontend never
   listened to. Also: voice state was being torn down and rebuilt on every
   Lobby → Game navigation (each page called the hook independently); it's
   now provided once by `app/room/[code]/layout.tsx`, which persists across
   that navigation the way Next.js layouts do.
2. **Login with an existing username on the same device failed.**
   `authStore.logout()` was deleting the stored `deviceSecret` from
   localStorage — the *only* credential that can ever re-authenticate that
   account on that device (there's no password by design). One logout
   permanently locked the user out of their own account on their own
   device. Fixed: logout only clears in-memory session state now.
3. **Chat messages not appearing.** The Lobby's `ChatPanel` never actually
   rendered a message list — it only ever showed the latest message as
   input *placeholder* text, which disappears the instant you start typing.
   Rewritten to show a real scrollable list above the input bar.
4. **Public room list showed the room code.** Now shows the host's avatar +
   username instead (matching the corresponding backend fix, which also
   fixed a real type mismatch — the old response didn't even include a
   `players` array).
5. **Host controls**: kicking a player and changing room settings (max
   players / debate mode / public-private) are new — `HostSettingsPanel`
   in the Lobby, plus a kick button on each non-host player row.

## Design system

All tokens live in `tailwind.config.ts` (colors `ink`/`mint`/`amber`/`fg`/
`danger`, radii `sm`/`md`/`lg`/`pill`, glow shadows `mint`/`amber`) — no
hardcoded hex values in components. `app/globals.css` sets `dir: rtl`
globally; the `.ltr-nums` utility class isolates numeric displays (timers,
XP, room codes) so they read left-to-right inside the RTL page.

## Phase 7 — Polish

- **Sound**: every effect (click, toggle, success, error, notification, countdown tick, win fanfare) is synthesized at runtime via the Web Audio API in `lib/sound.ts` — no audio files, no licensing questions. Volume is wired to the Settings sliders and persisted (`store/settingsStore.ts`). Music volume is wired but silent — no track shipped; ready for one to be dropped in later.
- **Smooth transitions**: the Game screen's three sub-views (Game/Voting/Winner) now crossfade via `AnimatePresence mode="wait"` instead of swapping abruptly; the Games Hub cards stagger in on mount.
- **Micro interactions**: ready-status pills animate on change, avatar selection has a selection sound + focus ring, mic/vote/reaction taps all have a matching sound cue.
- **Loading states**: a reusable `Spinner` now covers the Lobby's "connecting" state and Join Room's public-room fetch, replacing bare loading text.
- **Performance**: `AvatarBadge` and `PlayerRow` are memoized (both render in lists/duel rings where most re-renders don't change their props); the Game screen subscribes to individual `useGameStore` slices instead of the whole object, so a timer tick no longer re-renders things that only care about the topic or debater names.
- **Accessibility**: `MotionConfig reducedMotion="user"` (app-wide, in `components/providers/MotionProvider.tsx`) auto-respects the OS "reduce motion" setting for every animation. Added `aria-label`s on every icon-only control, `aria-live` regions for phase/timer/ready-state announcements, `role="status"`/`role="group"` where appropriate, and converted avatar selection from clickable `<div>`s to a real keyboard-operable `radiogroup`.


- This code has **not been run** — same sandbox constraint as every prior
  phase, no network access for `npm install`. Reviewed every import, prop,
  and event name by hand against the Phase 4 event catalog; please run
  `npm install && npx tsc --noEmit` before treating it as final.
- `useGameStore`/`useRoomStore` are in-memory only (not persisted), so a
  hard page refresh mid-match loses the live match view — the Game screen
  falls back to a "no active round" state with a way back to the Lobby
  rather than crashing, but there's no backend endpoint yet to fetch "the
  room's current match" and resync. Worth a small Phase 4 addition
  (`GET /rooms/:code/current-match`) if refresh-resilience matters before
  launch.
- Avatars are emoji placeholders, matching the Phase 2 mockup — swap
  `lib/avatars.ts` if you move to custom illustrated avatars later.
- No sound files wired yet (volume sliders in Settings are UI-only) —
  that's explicitly Phase 7 (Polish) per the project plan.
- Predictions (`audience:predict`) are wired end-to-end at the hook level
  (`castPrediction`) but have no UI control yet — Phase 2's mockup never
  designed a distinct "predict" affordance separate from voting, so this
  was left for a follow-up design pass rather than guessed at now.
