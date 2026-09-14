// Single source of truth for socket event names + payload shapes, imported
// by every gateway and (eventually) the frontend socket client, so a typo
// in an event name is a compile error instead of a silent no-op at runtime.

export const SocketEvents = {
  // Connection / presence
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE_SYNC: 'room:stateSync',
  ROOM_CLOSED: 'room:closed',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',

  // Lobby
  LOBBY_PLAYER_JOINED: 'lobby:playerJoined',
  LOBBY_PLAYER_LEFT: 'lobby:playerLeft',
  LOBBY_READY_TOGGLE: 'lobby:readyToggle',
  LOBBY_PLAYER_READY_CHANGED: 'lobby:playerReadyChanged',
  LOBBY_HOST_TRANSFERRED: 'lobby:hostTransferred',
  LOBBY_CHAT_MESSAGE: 'lobby:chatMessage',
  LOBBY_CHAT_HISTORY: 'lobby:chatHistory',
  LOBBY_START_MATCH: 'lobby:startMatch',
  LOBBY_KICK_PLAYER: 'lobby:kickPlayer',
  LOBBY_KICKED: 'lobby:kicked',
  LOBBY_UPDATE_SETTINGS: 'lobby:updateSettings',

  // Game / match
  GAME_MATCH_STARTED: 'game:matchStarted',
  GAME_PHASE_CHANGED: 'game:phaseChanged',
  GAME_TIMER_TICK: 'game:timerTick',
  GAME_TURN_SUBMITTED: 'game:turnSubmitted',

  // Topic vote — runs after debaters are picked and before the match
  // itself is created, so it's addressed by roomId, not matchId.
  GAME_TOPIC_VOTE_STARTED: 'game:topicVoteStarted',
  GAME_TOPIC_VOTE_CAST: 'game:topicVoteCast',
  GAME_TOPIC_VOTE_UPDATE: 'game:topicVoteUpdate',
  GAME_TOPIC_VOTE_TICK: 'game:topicVoteTick',

  // Audience
  AUDIENCE_REACT: 'audience:react',
  AUDIENCE_PREDICT: 'audience:predict',

  // Voting / results
  VOTING_CAST_VOTE: 'voting:castVote',
  VOTING_CLOSED: 'voting:closed',
  RESULTS_WINNER_ANNOUNCED: 'results:winnerAnnounced',

  // Errors (emitted by WsExceptionFilter)
  ERROR: 'error',

  // Voice chat (mesh WebRTC) — see voice/voice.gateway.ts. Room-scoped, not
  // phase-gated, so the same events work in both the Lobby and the Game
  // screen.
  VOICE_JOIN: 'voice:join',
  VOICE_LEAVE: 'voice:leave',
  VOICE_ACTIVE_PEERS: 'voice:activePeers',
  VOICE_PEER_JOINED: 'voice:peerJoined',
  VOICE_PEER_LEFT: 'voice:peerLeft',
  VOICE_SIGNAL: 'voice:signal',
  VOICE_MIC_STATE: 'voice:micState',
} as const;

export interface RoomPlayerSummary {
  userId: string;
  username: string;
  avatar: string;
  role: 'HOST' | 'PLAYER';
  isReady: boolean;
  isOnline: boolean;
}

export interface MatchStartedPayload {
  matchId: string;
  topic: string;
  debaterA: { userId: string; username: string; stanceLabel: string };
  debaterB: { userId: string; username: string; stanceLabel: string };
}

export interface PhaseChangedPayload {
  matchId: string;
  phase: 'PREPARING' | 'ROUND_1' | 'ROUND_2' | 'FINAL' | 'VOTING' | 'COMPLETED';
  durationSeconds: number;
  speakerId?: string;
}

export interface TopicVoteStartedPayload {
  candidates: { topicId: string; text: string }[];
  durationSeconds: number;
  debaterA: { userId: string; username: string };
  debaterB: { userId: string; username: string };
}

export interface TopicVoteUpdatePayload {
  counts: Record<string, number>; // topicId -> vote count
}

export interface WinnerAnnouncedPayload {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  votes: { debaterA: number; debaterB: number };
  xpAwarded: Record<string, number>;
  correctPredictorIds: string[];
}
