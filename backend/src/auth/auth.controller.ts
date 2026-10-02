import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('username')
  checkUsername(@Query('username') username = '') {
    // Temporary runtime isolation: keep this endpoint independent of Prisma
    // so we can determine whether Vercel's 500 is caused by the DB path or
    // by Nest/Vercel runtime wiring.
    const normalizedUsername = username.trim();
    const valid =
      normalizedUsername.length >= 3 &&
      normalizedUsername.length <= 20 &&
      /^[\p{L}0-9_]+$/u.test(normalizedUsername);

    return { available: valid, valid };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Tighter rate limit than the global default — login is the endpoint
  // most worth throttling against credential-guessing.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
