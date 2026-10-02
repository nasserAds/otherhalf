import {
  Body,
  Controller,
  Delete,
  Patch,
  Headers,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { UsersService } from './users.service';
import { DeleteUserDto } from './dto/delete-user.dto';
import { AdminAdjustCurrencyDto } from './dto/admin-adjust-currency.dto';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('currency')
  async adjustPlayerCurrency(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body() dto: AdminAdjustCurrencyDto,
  ) {
    this.assertAdminKey(adminKey);
    return this.usersService.adjustPlayerCurrency(dto.username, dto.action, dto.xp, dto.coins);
  }

  @Delete()
  async deleteUser(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body() dto: DeleteUserDto,
  ) {
    this.assertAdminKey(adminKey);
    return this.usersService.deleteUserByUsername(dto.username);
  }

  private assertAdminKey(adminKey: string | undefined) {
    const configuredKey = process.env.ADMIN_SECRET;

    if (!configuredKey) {
      throw new HttpException('admin is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    if (!adminKey || !this.keysMatch(adminKey, configuredKey)) {
      throw new UnauthorizedException('invalid admin key');
    }
  }

  private keysMatch(provided: string, configured: string) {
    const providedBuffer = Buffer.from(provided);
    const configuredBuffer = Buffer.from(configured);

    if (providedBuffer.length !== configuredBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, configuredBuffer);
  }
}
