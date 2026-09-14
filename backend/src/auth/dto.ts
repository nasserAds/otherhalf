import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { Avatar } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[\p{L}0-9_]+$/u, {
    message: 'username may only contain letters, numbers, and underscores',
  })
  username!: string;

  @IsEnum(Avatar)
  avatar!: Avatar;
}

export class LoginDto {
  @IsString()
  @Length(3, 20)
  username!: string;

  @IsString()
  deviceSecret!: string;
}
