export declare const SocketEvents: {
    readonly ROOM_JOIN: "room:join";
    readonly ROOM_LEAVE: "room:leave";
    readonly ROOM_STATE_SYNC: "room:stateSync";
    readonly ROOM_CLOSED: "room:closed";
    readonly PRESENCE_ONLINE: "presence:online";
    readonly PRESENCE_OFFLINE: "presence:offline";
    readonly LOBBY_PLAYER_JOINED: "lobby:playerJoined";
    readonly LOBBY_PLAYER_LEFT: "lobby:playerLeft";
    readonly LOBBY_READY_TOGGLE: "lobby:readyToggle";
    readonly LOBBY_PLAYER_READY_CHANGED: "lobby:playerReadyChanged";
    readonly LOBBY_HOST_TRANSFERRED: "lobby:hostTransferred";
    readonly LOBBY_CHAT_MESSAGE: "lobby:chatMessage";
    readonly LOBBY_START_MATCH: "lobby:startMatch";
    readonly LOBBY_KICK_PLAYER: "lobby:kickPlayer";
    readonly LOBBY_KICKED: "lobby:kicked";
    readonly LOBBY_UPDATE_SETTINGS: "lobby:updateSettings";
    readonly GAME_MATCH_STARTED: "game:matchStarted";
    readonly GAME_PHASE_CHANGED: "game:phaseChanged";
    readonly GAME_TIMER_TICK: "game:timerTick";
    readonly GAME_TURN_SUBMITTED: "game:turnSubmitted";
    readonly GAME_TOPIC_VOTE_STARTED: "game:topicVoteStarted";
    readonly GAME_TOPIC_VOTE_CAST: "game:topicVoteCast";
    readonly GAME_TOPIC_VOTE_UPDATE: "game:topicVoteUpdate";
    readonly GAME_TOPIC_VOTE_TICK: "game:topicVoteTick";
    readonly AUDIENCE_REACT: "audience:react";
    readonly AUDIENCE_PREDICT: "audience:predict";
    readonly VOTING_CAST_VOTE: "voting:castVote";
    readonly VOTING_CLOSED: "voting:closed";
    readonly RESULTS_WINNER_ANNOUNCED: "results:winnerAnnounced";
    readonly ERROR: "error";
    readonly VOICE_JOIN: "voice:join";
    readonly VOICE_LEAVE: "voice:leave";
    readonly VOICE_ACTIVE_PEERS: "voice:activePeers";
    readonly VOICE_PEER_JOINED: "voice:peerJoined";
    readonly VOICE_PEER_LEFT: "voice:peerLeft";
    readonly VOICE_SIGNAL: "voice:signal";
    readonly VOICE_MIC_STATE: "voice:micState";
};
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
    debaterA: {
        userId: string;
        username: string;
        stanceLabel: string;
    };
    debaterB: {
        userId: string;
        username: string;
        stanceLabel: string;
    };
}
export interface PhaseChangedPayload {
    matchId: string;
    phase: 'PREPARING' | 'ROUND_1' | 'ROUND_2' | 'FINAL' | 'VOTING' | 'COMPLETED';
    durationSeconds: number;
    speakerId?: string;
}
export interface TopicVoteStartedPayload {
    candidates: {
        topicId: string;
        text: string;
    }[];
    durationSeconds: number;
    debaterA: {
        userId: string;
        username: string;
    };
    debaterB: {
        userId: string;
        username: string;
    };
}
export interface TopicVoteUpdatePayload {
    counts: Record<string, number>;
}
export interface WinnerAnnouncedPayload {
    matchId: string;
    winnerId: string | null;
    isDraw: boolean;
    votes: {
        debaterA: number;
        debaterB: number;
    };
    xpAwarded: Record<string, number>;
    correctPredictorIds: string[];
}
