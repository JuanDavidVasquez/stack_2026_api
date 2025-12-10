import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, User } from 'src/models';
import { CryptoService } from 'src/common/services/crypto.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {}

  async createToken(
    user: User,
    token: string,
    ip?: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const tokenHash = this.cryptoService.hashData(token);
    
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    if (!expiresIn) {
      throw new Error('jwt.refreshExpiresIn is not defined');
    }
    const expiresAt = this.calculateExpirationDate(expiresIn);

    const refreshToken = this.refreshTokenRepository.create({
      tokenHash,
      user,
      expiresAt,
      createdByIp: ip || null,
      userAgent: userAgent || null,
    });

    const saved = await this.refreshTokenRepository.save(refreshToken);
    this.logger.log(`Refresh token created for user: ${user.id}`);
    
    return saved;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });
  }

  async validateToken(token: string): Promise<RefreshToken> {
    const tokenHash = this.cryptoService.hashData(token);
    const refreshToken = await this.findByTokenHash(tokenHash);

    if (!refreshToken) {
      throw new UnauthorizedException('Token inválido');
    }

    if (refreshToken.isRevoked) {
      this.logger.warn(`Attempt to use revoked token: ${tokenHash.substring(0, 10)}...`);
      
      if (refreshToken.replacedByTokenHash) {
        await this.revokeTokenFamily(refreshToken);
        throw new UnauthorizedException('Token ha sido revocado. Posible intento de reutilización detectado.');
      }
      
      throw new UnauthorizedException('Token ha sido revocado');
    }

    if (refreshToken.isExpired()) {
      throw new UnauthorizedException('Token ha expirado');
    }

    return refreshToken;
  }

  async rotateToken(
    oldToken: string,
    newToken: string,
    ip?: string,
  ): Promise<RefreshToken> {
    const oldTokenHash = this.cryptoService.hashData(oldToken);
    const newTokenHash = this.cryptoService.hashData(newToken);

    const oldRefreshToken = await this.validateToken(oldToken);

    oldRefreshToken.replaceBy(newTokenHash);
    await this.refreshTokenRepository.save(oldRefreshToken);

    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    if (!expiresIn) {
      throw new Error('jwt.refreshExpiresIn is not defined');
    }
    const expiresAt = this.calculateExpirationDate(expiresIn);

    const newRefreshToken = this.refreshTokenRepository.create({
      tokenHash: newTokenHash,
      user: oldRefreshToken.user,
      expiresAt,
      createdByIp: ip || null,
      userAgent: oldRefreshToken.userAgent,
    });

    const saved = await this.refreshTokenRepository.save(newRefreshToken);
    this.logger.log(`Token rotated for user: ${oldRefreshToken.user.id}`);
    
    return saved;
  }

  async revokeToken(
    token: string,
    reason: string,
    ip?: string,
  ): Promise<void> {
    const tokenHash = this.cryptoService.hashData(token);
    const refreshToken = await this.findByTokenHash(tokenHash);

    if (!refreshToken) {
      throw new NotFoundException('Token no encontrado');
    }

    refreshToken.revoke(reason, ip);
    await this.refreshTokenRepository.save(refreshToken);
    
    this.logger.log(`Token revoked: ${reason}`);
  }

  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        user: { id: userId },
        isRevoked: false,
      },
    });

    for (const token of tokens) {
      token.revoke(reason);
    }

    await this.refreshTokenRepository.save(tokens);
    
    this.logger.log(`All tokens revoked for user ${userId}: ${tokens.length} tokens`);
    return tokens.length;
  }

  async revokeTokenFamily(token: RefreshToken): Promise<void> {
    const tokensToRevoke: RefreshToken[] = [];

    let currentToken: RefreshToken | null = token;
    while (currentToken?.replacedByTokenHash) {
      const nextToken = await this.findByTokenHash(currentToken.replacedByTokenHash);
      if (nextToken && !nextToken.isRevoked) {
        tokensToRevoke.push(nextToken);
      }
      currentToken = nextToken;
    }

    for (const tokenToRevoke of tokensToRevoke) {
      tokenToRevoke.revoke('Token family compromised - reuse detected');
    }

    if (tokensToRevoke.length > 0) {
      await this.refreshTokenRepository.save(tokensToRevoke);
      this.logger.warn(`Token family revoked: ${tokensToRevoke.length} tokens`);
    }
  }

  async getActiveTokens(userId: string): Promise<RefreshToken[]> {
    return await this.refreshTokenRepository.find({
      where: {
        user: { id: userId },
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(`Deleted ${deletedCount} expired tokens`);
    
    return deletedCount;
  }

  async countUserSessions(userId: string): Promise<number> {
    return await this.refreshTokenRepository.count({
      where: {
        user: { id: userId },
        isRevoked: false,
      },
    });
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = new Date();
    
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid time unit');
    }
  }
}