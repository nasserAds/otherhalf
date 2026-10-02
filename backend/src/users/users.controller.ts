import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, AuthUser } from '../common/decorators';
import { UsersService } from './users.service';
import { UpdateUsernameDto } from './dto/update-username.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me/username')
  updateUsername(@CurrentUser() user: AuthUser, @Body() dto: UpdateUsernameDto) {
    return this.usersService.updateUsername(user.userId, dto);
  }

  @Get('me/xp-history')
  getMyXpHistory(@CurrentUser() user: AuthUser) {
    return this.usersService.getXpHistory(user.userId);
  }
}
