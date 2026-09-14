// Mirrors backend/src/common/socket-events.ts exactly. Kept as a plain
// string catalog (not a shared package) since frontend and backend are
// separate deployable projects in this setup — see Phase 1 folder plan.
export const SocketEvents = {
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE_SYNC: 'room:stateSync',
  ROOM_CLOSED: 'room:closed',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',

  LOBBY_PLAYER_JOINED: 'lobby:playerJoined',
  LOBBY_PLAYER_LEFT: 'lobby:playerLeft',
  LOBBY_READY_TOGGLE: 'lobby:readyToggle',
  LOBBY_PLAYER_READY_CHANGED: 'lobby:playerReadyChanged',
  LOBBY_HOST_TRANSFERRED: 'lobby:hostTransferred',
  LOBBY_CHAT_MESSAGE: 'lobby:chatMessage',
  LOBBY_START_MATCH: 'lobby:startMatch',
  LOBBY_KICK_PLAYER: 'lobby:kickPlayer',
  LOBBY_KICKED: 'lobby:kicked',
  LOBBY_UPDATE_SETTINGS: 'lobby:updateSettings',

  GAME_MATCH_STARTED: 'game:matchStarted',
  GAME_PHASE_CHANGED: 'game:phaseChanged',
  GAME_TIMER_TICK: 'game:timerTick',
  GAME_TURN_SUBMITTED: 'game:turnSubmitted',

  GAME_TOPIC_VOTE_STARTED: 'game:topicVoteStarted',
  GAME_TOPIC_VOTE_CAST: 'game:topicVoteCast',
  GAME_TOPIC_VOTE_UPDATE: 'game:topicVoteUpdate',
  GAME_TOPIC_VOTE_TICK: 'game:topicVoteTick',

  AUDIENCE_REACT: 'audience:react',
  AUDIENCE_PREDICT: 'audience:predict',

  VOTING_CAST_VOTE: 'voting:castVote',
  VOTING_CLOSED: 'voting:closed',
  RESULTS_WINNER_ANNOUNCED: 'results:winnerAnnounced',

  ERROR: 'error',

  VOICE_JOIN: 'voice:join',
  VOICE_LEAVE: 'voice:leave',
  VOICE_ACTIVE_PEERS: 'voice:activePeers',
  VOICE_PEER_JOINED: 'voice:peerJoined',
  VOICE_PEER_LEFT: 'voice:peerLeft',
  VOICE_SIGNAL: 'voice:signal',
  VOICE_MIC_STATE: 'voice:micState',
} as const;
