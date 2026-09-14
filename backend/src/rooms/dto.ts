import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { DebateMode, RoomVisibility } from '@prisma/client';

export class CreateRoomDto {
  @IsInt()
  @Min(4)
  @Max(12)
  maxPlayers!: number;

  @IsEnum(DebateMode)
  debateMode!: DebateMode;

  @IsEnum(RoomVisibility)
  visibility!: RoomVisibility;
}

export class JoinRoomDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ListPublicRoomsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}
