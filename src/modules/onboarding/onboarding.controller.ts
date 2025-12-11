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
   * Registra un nuevo usuario y envía código de verificación
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

  // ==================== VERIFICACIÓN DE EMAIL ====================

  /**
   * POST /onboarding/verify-email
   * Verifica el email del usuario con el código enviado
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Lang() lang: string,
  ) {
    return this.onboardingService.verifyEmail(verifyEmailDto, lang);
  }

  // ==================== REENVIAR CÓDIGO ====================

  /**
   * POST /onboarding/resend-verification
   * Reenvía el código de verificación
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendDto: ResendVerificationDto,
    @Lang() lang: string,
  ) {
    return this.onboardingService.resendVerification(resendDto, lang);
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
    return this.onboardingService.resetPassword(resetDto);
  }

  /**
   * GET /onboarding/validate-token/:token
   * Valida si un token de recuperación es válido
   */
  @Public()
  @Get('validate-token/:token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Param('token') token: string) {
    return this.onboardingService.validateResetToken(token);
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
    return this.onboardingService.changePassword(userId, changeDto);
  }
}