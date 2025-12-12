import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';
import { Public } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { Lang } from '../../common/decorators/i18n.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // ==================== REGISTRO ====================

  /**
   * POST /onboarding/register
   * Registra un nuevo usuario y envía email con link de activación
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Lang() lang: string,
  ) {
    return this.onboardingService.register(registerDto, lang);
  }

  // ==================== ACTIVACIÓN DE CUENTA ====================

  /**
   * POST /onboarding/activate/:token
   * Activa la cuenta del usuario con el token enviado por email
   */
  @Public()
  @Post('activate/:token')
  @HttpCode(HttpStatus.OK)
  async activateAccount(
    @Param('token') token: string,
    @Lang() lang: string,
  ) {
    return this.onboardingService.activateAccount(token, lang);
  }

  /**
   * GET /onboarding/validate-activation/:token
   * Valida si un token de activación es válido (sin activar)
   */
  @Public()
  @Get('validate-activation/:token')
  @HttpCode(HttpStatus.OK)
  async validateActivationToken(
    @Param('token') token: string,
    @Lang() lang: string,
  ) {
    return this.onboardingService.validateActivationToken(token, lang);
  }

  // ==================== REENVIAR EMAIL DE ACTIVACIÓN ====================

  /**
   * POST /onboarding/resend-activation
   * Reenvía el email de activación
   */
  @Public()
  @Post('resend-activation')
  @HttpCode(HttpStatus.OK)
  async resendActivation(
    @Body() body: { email: string },
    @Lang() lang: string,
  ) {
    return this.onboardingService.resendActivation(body.email, lang);
  }

  // ==================== RECUPERACIÓN DE CONTRASEÑA ====================

  /**
   * POST /onboarding/forgot-password
   * Envía link de recuperación de contraseña
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotDto: ForgotPasswordDto,
    @Lang() lang: string,
  ) {
    return this.onboardingService.forgotPassword(forgotDto, lang);
  }

  /**
   * POST /onboarding/reset-password
   * Resetea la contraseña con el token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetDto: ResetPasswordDto,
    @Lang() lang: string,
  ) {
    return this.onboardingService.resetPassword(resetDto, lang);
  }

  /**
   * GET /onboarding/validate-reset-token/:token
   * Valida si un token de recuperación es válido
   */
  @Public()
  @Get('validate-reset-token/:token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(
    @Param('token') token: string,
    @Lang() lang: string,
  ) {
    return this.onboardingService.validateResetToken(token, lang);
  }

  // ==================== CAMBIO DE CONTRASEÑA (AUTENTICADO) ====================

  /**
   * PATCH /onboarding/change-password
   * Cambia la contraseña del usuario autenticado
   * Requiere JWT token válido
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() changeDto: ChangePasswordDto,
    @Lang() lang: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.onboardingService.changePassword(userId, changeDto, lang);
  }
}