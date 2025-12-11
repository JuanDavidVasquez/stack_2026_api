// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshResponseDto } from './dto';
import { User } from 'src/models';
import { UserRole, UserStatus } from 'src/models/enums';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Register attempt for email: ${registerDto.email}`);

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('user.emailExists');
    }

    if (registerDto.username) {
      const existingUsername = await this.usersService.findByUsername(registerDto.username);
      if (existingUsername) {
        throw new ConflictException('user.usernameExists');
      }
    }

    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      username: registerDto.username ?? '',
      firstName: registerDto.firstName ?? '',
      lastName: registerDto.lastName ?? '',
      phone: registerDto.phone,
      role: 'user',
    });

    this.logger.log(`User registered successfully: ${user.id}`);

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('auth.login.invalidCredentials');
    }

    if(user.status === UserStatus.PENDING) {
      throw new UnauthorizedException('auth.login.accountPending');
    }

    if (user.isLocked()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / (1000 * 60)
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minutos`
      );
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      await this.usersService.incrementLoginAttempts(user.id);
      this.logger.warn(`Failed login attempt for user: ${user.id}`);
      throw new UnauthorizedException('auth.login.invalidCredentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('auth.login.accountSuspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('auth.login.accountInactive');
    }

    await this.usersService.updateLastLogin(user.id, ip);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return this.generateAuthResponse(user, ip, userAgent);
  }

  async refresh(
    refreshToken: string,
    ip?: string,
  ): Promise<RefreshResponseDto> {
    this.logger.log('Refresh token attempt');

    const storedToken = await this.refreshTokenService.validateToken(refreshToken);

    const newAccessToken = this.generateAccessToken(storedToken.user);
    const newRefreshToken = this.generateRefreshToken(storedToken.user);

    await this.refreshTokenService.rotateToken(
      refreshToken,
      newRefreshToken,
      ip,
    );

    this.logger.log(`Tokens refreshed for user: ${storedToken.user.id}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, ip?: string): Promise<void> {
    this.logger.log('Logout attempt');

    try {
      await this.refreshTokenService.revokeToken(
        refreshToken,
        'User logout',
        ip,
      );
      this.logger.log('User logged out successfully');
    } catch (error) {
      this.logger.warn('Logout attempt with invalid token');
    }
  }

  async logoutAll(userId: string): Promise<number> {
    this.logger.log(`Logout all sessions for user: ${userId}`);

    const revokedCount = await this.refreshTokenService.revokeAllUserTokens(
      userId,
      'User requested logout from all devices',
    );

    this.logger.log(`${revokedCount} sessions terminated for user: ${userId}`);

    return revokedCount;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async getActiveSessions(userId: string) {
    const tokens = await this.refreshTokenService.getActiveTokens(userId);

    return tokens.map(token => ({
      id: token.id,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      createdByIp: token.createdByIp,
      userAgent: token.userAgent,
      daysUntilExpiration: token.daysUntilExpiration(),
    }));
  }

  async revokeSession(userId: string, tokenId: string, ip?: string): Promise<void> {
    const tokens = await this.refreshTokenService.getActiveTokens(userId);
    const token = tokens.find(t => t.id === tokenId);

    if (!token) {
      throw new BadRequestException('Sesión no encontrada');
    }

    await this.refreshTokenService.revokeToken(
      token.tokenHash,
      'Session revoked by user',
      ip,
    );

    this.logger.log(`Session ${tokenId} revoked for user: ${userId}`);
  }

  private generateAuthResponse(
    user: User,
    ip?: string,
    userAgent?: string,
  ): AuthResponseDto {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    this.refreshTokenService.createToken(user, refreshToken, ip, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<number>('jwt.expiresIn'),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<number>('jwt.refreshExpiresIn'),
    });
  }
}