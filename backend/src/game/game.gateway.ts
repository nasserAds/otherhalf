import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { IsString, Length } from 'class-validator';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../common/guards';
import { WsExceptionFilter } from '../common/filters';
import { SocketEvents } from '../common/socket-events';
import { GameService } from './game.service';
import { VotingService } from '../voting/voting.service';
import { CastVoteDto, PredictDto } from '../voting/dto';

class SubmitTurnDto {
  @IsString()
  matchId!: string;

  @IsString()
  @Length(0, 1000)
  content!: string;
}

class ReactDto {
  @IsString()
  matchId!: string;

  @IsString()
  @Length(1, 8)
  emoji!: string;
}

class TopicVoteDto {
  @IsString()
  topicId!: string;
}

@UseFilters(WsExceptionFilter)
@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: true, path: '/api/backend/socket.io' })
export class GameGateway {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly votingService: VotingService,
  ) {}

  @SubscribeMessage(SocketEvents.GAME_TOPIC_VOTE_CAST)
  onTopicVoteCast(@ConnectedSocket() client: Socket, @MessageBody() body: TopicVoteDto) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    this.gameService.castTopicVote(roomId, user.userId, body.topicId, this.server);
  }

  @SubscribeMessage(SocketEvents.GAME_TURN_SUBMITTED)
  async onTurnSubmitted(@ConnectedSocket() client: Socket, @MessageBody() body: SubmitTurnDto) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    const round = await this.gameService.submitTurn(body.matchId, user.userId, body.content);
    this.server.to(roomId).emit(SocketEvents.GAME_TURN_SUBMITTED, {
      matchId: body.matchId,
      speakerId: user.userId,
      content: round.content,
    });
  }

  // Cosmetic only — no gameplay effect, just fanned out to the room.
  @SubscribeMessage(SocketEvents.AUDIENCE_REACT)
  async onReact(@ConnectedSocket() client: Socket, @MessageBody() body: ReactDto) {
    const roomId = client.data.roomId;
    this.server.to(roomId).emit(SocketEvents.AUDIENCE_REACT, {
      matchId: body.matchId,
      emoji: body.emoji,
      userId: client.data.user.userId,
    });
  }

  @SubscribeMessage(SocketEvents.AUDIENCE_PREDICT)
  async onPredict(@ConnectedSocket() client: Socket, @MessageBody() body: PredictDto) {
    const user = client.data.user;
    await this.votingService.castPrediction(body.matchId, user.userId, body.predictedWinnerId);
    // Predictions are private until resolution — no broadcast here.
    client.emit(SocketEvents.AUDIENCE_PREDICT, { matchId: body.matchId, accepted: true });
  }

  @SubscribeMessage(SocketEvents.VOTING_CAST_VOTE)
  async onCastVote(@ConnectedSocket() client: Socket, @MessageBody() body: CastVoteDto) {
    const user = client.data.user;
    await this.votingService.castVote(body.matchId, user.userId, body.votedForId);
    // Votes stay hidden until the winner announcement (prevents
    // bandwagon voting) — we only ack the voter, not broadcast the pick.
    client.emit(SocketEvents.VOTING_CAST_VOTE, { matchId: body.matchId, accepted: true });
  }
}
