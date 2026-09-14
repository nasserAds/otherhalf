import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { VotingService } from '../voting/voting.service';
import { CastVoteDto, PredictDto } from '../voting/dto';
declare class SubmitTurnDto {
    matchId: string;
    content: string;
}
declare class ReactDto {
    matchId: string;
    emoji: string;
}
declare class TopicVoteDto {
    topicId: string;
}
export declare class GameGateway {
    private readonly gameService;
    private readonly votingService;
    server: Server;
    constructor(gameService: GameService, votingService: VotingService);
    onTopicVoteCast(client: Socket, body: TopicVoteDto): void;
    onTurnSubmitted(client: Socket, body: SubmitTurnDto): Promise<void>;
    onReact(client: Socket, body: ReactDto): Promise<void>;
    onPredict(client: Socket, body: PredictDto): Promise<void>;
    onCastVote(client: Socket, body: CastVoteDto): Promise<void>;
}
export {};
