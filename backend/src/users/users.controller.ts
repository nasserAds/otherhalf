import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, AuthUser } from '../common/decorators';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Get('me/xp-history')
  getMyXpHistory(@CurrentUser() user: AuthUser) {
    return this.usersService.getXpHistory(user.userId);
  }
}
