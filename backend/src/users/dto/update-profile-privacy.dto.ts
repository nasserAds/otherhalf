import { IsBoolean } from 'class-validator';

export class UpdateProfilePrivacyDto {
  @IsBoolean()
  profilePublic!: boolean;
}
