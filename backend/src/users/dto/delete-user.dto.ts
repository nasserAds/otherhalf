import { IsString, Length, Matches } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[\p{L}0-9_]+$/u)
  username!: string;
}
