import { IsIn, IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';

export class AdminAdjustCurrencyDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[\p{L}0-9_]+$/u)
  username!: string;

  @IsIn(['add', 'remove'])
  action!: 'add' | 'remove';

  @IsInt()
  @Min(0)
  @Max(1000000000)
  xp!: number;

  @IsInt()
  @Min(0)
  @Max(1000000000)
  coins!: number;
}
