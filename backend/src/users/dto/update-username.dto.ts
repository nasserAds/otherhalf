import { IsString, Length, Matches } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[\p{L}0-9_]+$/u)
  username!: string;
}
