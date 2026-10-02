import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, AuthUser } from '../common/decorators';
import { UsersService } from './users.service';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdateProfilePrivacyDto } from './dto/update-profile-privacy.dto';
import { Optional } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  getPublicProfile(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.usersService.getPublicProfile(username, user.userId);
  }

  @Patch('me/profile-privacy')
  updateProfilePrivacy(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfilePrivacyDto) {
    return this.usersService.updateProfilePrivacy(user.userId, dto.profilePublic);
  }

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
