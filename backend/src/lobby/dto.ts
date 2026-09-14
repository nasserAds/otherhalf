import { IsString, Length } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @Length(1, 300)
  content!: string;
}
