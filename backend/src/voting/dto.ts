import { IsString } from 'class-validator';

export class CastVoteDto {
  @IsString()
  matchId!: string;

  @IsString()
  votedForId!: string;
}

export class PredictDto {
  @IsString()
  matchId!: string;

  @IsString()
  predictedWinnerId!: string;
}
