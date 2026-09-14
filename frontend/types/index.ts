export type Avatar = 'LION' | 'TIGER' | 'FOX' | 'PANDA' | 'OWL' | 'WOLF';

export type DebateMode = 'TEXT' | 'VOICE' | 'TEXT_VOICE';
export type RoomVisibility = 'PUBLIC' | 'PRIVATE';
export type RoomStatus = 'LOBBY' | 'IN_PROGRESS' | 'CLOSED';
export type PlayerRole = 'HOST' | 'PLAYER';
export type MatchPhase = 'PREPARING' | 'ROUND_1' | 'ROUND_2' | 'FINAL' | 'VOTING' | 'COMPLETED';

export interface User {
  id: string;
  username: string;
  avatar: Avatar;
  xp: number;
  coins: number;
  wins: number;
  losses: number;
}

export interface RoomPlayer {
  userId: string;
  role: PlayerRole;
  isReady: boolean;
  isOnline: boolean;
  user: Pick<User, 'username' | 'avatar'>;
}

export interface Room {
  id: string;
  code: string;
  visibility: RoomVisibility;
  maxPlayers: number;
  debateMode: DebateMode;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
}

// Shape returned by GET /rooms/public — intentionally lighter than Room:
// no join code shown (meaningless until you've decided to join) and no
// full player list, just who's hosting and how many are in already.
export interface PublicRoomSummary {
  id: string;
  code: string;
  maxPlayers: number;
  debateMode: DebateMode;
  host: Pick<User, 'username' | 'avatar'>;
  _count: { players: number };
}

export interface MatchDebater {
  userId: string;
  username: string;
  stanceLabel: string;
}

export interface MatchStartedPayload {
  matchId: string;
  topic: string;
  debaterA: MatchDebater;
  debaterB: MatchDebater;
}

export interface PhaseChangedPayload {
  matchId: string;
  phase: MatchPhase;
  durationSeconds: number;
  speakerId?: string;
}

export interface WinnerAnnouncedPayload {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  votes: { debaterA: number; debaterB: number };
  xpAwarded: Record<string, number>;
  correctPredictorIds: string[];
}

export interface TopicCandidate {
  topicId: string;
  text: string;
}

export interface TopicVoteStartedPayload {
  candidates: TopicCandidate[];
  durationSeconds: number;
  debaterA: { userId: string; username: string };
  debaterB: { userId: string; username: string };
}
