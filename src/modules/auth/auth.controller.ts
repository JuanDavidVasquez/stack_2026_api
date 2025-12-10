import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { loginSchema, registerSchema, refreshTokenSchema } from './dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { TranslationService } from 'src/common/services/translation.service';
import { Lang } from 'src/common/decorators/i18n.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly translation: TranslationService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) registerDto: RegisterDto,
    @Lang() lang: string,
  ) {
    const result = await this.authService.register(registerDto);

    return {
      message: this.translation.translate('auth.register.success', {}, lang),
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto,
    @Req() req: Request,
    @Lang() lang: string,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, ip, userAgent);

    return {
      message: this.translation.translate('auth.login.success', {}, lang),
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Lang() lang: string,
  ) {
    const ip = req.ip || req.socket.remoteAddress;

    const result = await this.authService.refresh(
      refreshTokenDto.refreshToken,
      ip,
    );

    return {
      message: this.translation.translate('auth.token.refreshed', {}, lang),
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Lang() lang: string,
  ) {
    const ip = req.ip || req.socket.remoteAddress;

    await this.authService.logout(refreshTokenDto.refreshToken, ip);

    return {
      message: this.translation.translate('auth.logout.success', {}, lang),
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser('id') userId: string, @Lang() lang: string) {
    const count = await this.authService.logoutAll(userId);

    return {
      message: this.translation.translate('auth.logoutAll.success', {}, lang),
      data: {
        sessionsTerminated: count,
      },
    };
  }

  @Get('sessions')
  async getSessions(@CurrentUser('id') userId: string, @Lang() lang: string) {
    const sessions = await this.authService.getActiveSessions(userId);

    return {
      message: this.translation.translate('auth.sessions.list', {}, lang),
      data: sessions,
    };
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
    @Lang() lang: string,
  ) {
    const ip = req.ip || req.socket.remoteAddress;

    await this.authService.revokeSession(userId, sessionId, ip);

    return {
      message: this.translation.translate('auth.session.revoked', {}, lang),
    };
  }

  @Get('me')
  async getMe(@CurrentUser() user: any, @Lang() lang: string) {
    return {
      message: this.translation.translate('auth.profile.retrieved', {}, lang),
      data: user,
    };
  }
}