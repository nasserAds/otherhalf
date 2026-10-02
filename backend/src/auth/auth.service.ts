import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

const SALT_ROUNDS = 10;
const USERNAME_PATTERN = /^[\p{L}0-9_]+$/u;

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  xp: true,
  coins: true,
  wins: true,
  losses: true,
  profilePublic: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async checkUsername(username: string) {
    const normalizedUsername = username.trim();
    const valid =
      normalizedUsername.length >= 3 &&
      normalizedUsername.length <= 20 &&
      USERNAME_PATTERN.test(normalizedUsername);

    if (!valid) {
      return { available: false, valid };
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });
    return { available: !existing, valid };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('username is already taken');
    }

    const deviceSecret = crypto.randomBytes(24).toString('base64url');
    const deviceSecretHash = await bcrypt.hash(deviceSecret, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        avatar: dto.avatar,
        deviceSecretHash,
      },
      select: PUBLIC_USER_SELECT,
    });

    return {
      accessToken: this.signToken(user.id, user.username),
      deviceSecret,
      user: this.toPublicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        ...PUBLIC_USER_SELECT,
        deviceSecretHash: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('invalid username or device secret');
    }

    const valid = await bcrypt.compare(dto.deviceSecret, user.deviceSecretHash);
    if (!valid) {
      throw new UnauthorizedException('invalid username or device secret');
    }

    return {
      accessToken: this.signToken(user.id, user.username),
      user: this.toPublicUser(user),
    };
  }

  private signToken(userId: string, username: string): string {
    return this.jwtService.sign({ sub: userId, username });
  }

  private toPublicUser(user: {
    id: string;
    username: string;
    avatar: string;
    xp: number;
    coins: number;
    wins: number;
    losses: number;
    profilePublic?: boolean;
  }) {
    const { id, username, avatar, xp, coins, wins, losses, profilePublic = true } = user;
    return { id, username, avatar, xp, coins, wins, losses, profilePublic };
  }
}
