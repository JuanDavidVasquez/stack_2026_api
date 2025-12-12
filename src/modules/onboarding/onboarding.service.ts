import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { I18nService } from 'nestjs-i18n';
import Redis from 'ioredis';

// DTOs
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

// Services
import { CryptoService } from '../../common/services/crypto.service';
import { MailService } from '../../common/mail/mail.service';
import { User } from 'src/models';
import { UserRole } from 'src/models/enums';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRedis()
    private readonly redis: Redis,

    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  // ==================== UTILS ====================

  /**
   * Normaliza el idioma desde el header Accept-Language
   * Maneja formatos como: "es-CO,es;q=0.9,en;q=0.8" -> "es"
   */
  private normalizeLang(lang?: string): string {
    if (!lang) return 'en';
    
    // Extraer el primer idioma de la lista y quitar la región
    const primaryLang = lang.split(',')[0].split('-')[0].trim().toLowerCase();
    
    // Validar que sea un idioma soportado
    const supportedLangs = ['en', 'es', 'pt'];
    return supportedLangs.includes(primaryLang) ? primaryLang : 'en';
  }

  // ==================== REGISTRO CON TOKEN DE ACTIVACIÓN ====================

  async register(
    registerDto: RegisterDto,
    lang?: string,
  ): Promise<{ message: string; email: string }> {
    const language = this.normalizeLang(lang);

    const { email, password, firstName, lastName, phone, username } = registerDto;

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        this.i18n.t('user.emailExists', { lang: language }) as string,
      );
    }

    // Verificar si el username ya existe
    const existingUsername = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      throw new ConflictException(
        this.i18n.t('user.usernameExists', { lang: language }) as string,
      );
    }

    // Crear usuario (inactivo hasta que active su cuenta)
    const hashedPassword = await this.cryptoService.hashPassword(password);

    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      username,
      emailVerified: false,
      isActive: false,
      role: UserRole.USER,
    });

    await this.userRepository.save(user);

    // Generar token de activación seguro (64 caracteres hexadecimales)
    const activationToken = this.cryptoService.generateToken(32);
    
    // Guardar en Redis: token -> userId, expira en 24 horas
    const redisKey = `activation:${activationToken}`;
    await this.redis.setex(redisKey, 86400, user.id.toString());

    // ✅ ENVIAR EMAIL - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      email.toLowerCase(),
      'ACCOUNT_ACTIVATION',
      {
        firstName,
        token: activationToken,
        expiresIn: 24,
      },
      language,
      {
        priority: 10, // Alta prioridad
        attempts: 5,
      },
    );

    this.logger.log(`Usuario registrado: ${email} (idioma: ${language})`);

    return {
      message: this.i18n.t('user.registered', { lang: language }) as string,
      email: email.toLowerCase(),
    };
  }

  // ==================== ACTIVAR CUENTA CON TOKEN ====================

  async activateAccount(
    token: string,
    lang?: string,
  ): Promise<{ message: string; email: string }> {
    const language = this.normalizeLang(lang);

    // Validar formato del token
    if (!token || token.length !== 64) {
      throw new BadRequestException(
        this.i18n.t('activation.invalidToken', { lang: language }) as string,
      );
    }

    const redisKey = `activation:${token}`;
    const userId = await this.redis.get(redisKey);

    if (!userId) {
      throw new BadRequestException(
        this.i18n.t('activation.tokenExpired', { lang: language }) as string,
      );
    }

    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      // Limpiar token inválido
      await this.redis.del(redisKey);
      throw new NotFoundException(
        this.i18n.t('user.notFound', { lang: language }) as string,
      );
    }

    // Verificar si ya está activado
    if (user.emailVerified && user.isActive()) {
      await this.redis.del(redisKey);
      throw new BadRequestException(
        this.i18n.t('activation.alreadyActivated', { lang: language }) as string,
      );
    }

    // Activar cuenta
    user.verifyEmail();
    await this.userRepository.save(user);

    // Eliminar token de Redis (un solo uso)
    await this.redis.del(redisKey);

    // ✅ ENVIAR EMAIL DE BIENVENIDA - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      user.email,
      'WELCOME',
      {
        firstName: user.firstName,
      },
      language,
    );

    this.logger.log(`Cuenta activada exitosamente: ${user.email} (idioma: ${language})`);

    return {
      message: this.i18n.t('activation.success', { lang: language }) as string,
      email: user.email,
    };
  }

  // ==================== REENVIAR EMAIL DE ACTIVACIÓN ====================

  async resendActivation(
    email: string,
    lang?: string,
  ): Promise<{ message: string }> {
    const language = this.normalizeLang(lang);

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // No revelar si el usuario existe o no (seguridad)
      this.logger.warn(`Intento de reenvío para email no registrado: ${email}`);
      return {
        message: this.i18n.t('activation.resendGeneric', { lang: language }) as string,
      };
    }

    // Si ya está activado, no hacer nada
    if (user.emailVerified && user.isActive()) {
      return {
        message: this.i18n.t('activation.resendGeneric', { lang: language }) as string,
      };
    }

    // Rate limiting: máximo 1 reenvío cada 2 minutos
    const rateLimitKey = `resend-activation:${email.toLowerCase()}`;
    const rateLimitExists = await this.redis.exists(rateLimitKey);

    if (rateLimitExists) {
      throw new BadRequestException(
        this.i18n.t('activation.rateLimitExceeded', { 
          lang: language,
          args: { minutes: 2 } 
        }) as string,
      );
    }

    // Generar nuevo token
    const activationToken = this.cryptoService.generateToken(32);
    
    // Guardar en Redis
    const redisKey = `activation:${activationToken}`;
    await this.redis.setex(redisKey, 86400, user.id.toString());

    // Establecer rate limit
    await this.redis.setex(rateLimitKey, 120, '1'); // 2 minutos

    // ✅ REENVIAR EMAIL - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      user.email,
      'ACCOUNT_ACTIVATION',
      {
        firstName: user.firstName,
        token: activationToken,
        expiresIn: 24,
      },
      language,
      {
        priority: 10,
        attempts: 5,
      },
    );

    this.logger.log(`Email de activación reenviado: ${email} (idioma: ${language})`);

    return {
      message: this.i18n.t('activation.resendGeneric', { lang: language }) as string,
    };
  }

  // ==================== VALIDAR TOKEN SIN ACTIVAR ====================

  async validateActivationToken(
    token: string,
    lang?: string,
  ): Promise<{ valid: boolean; message: string; email?: string }> {
    const language = this.normalizeLang(lang);

    if (!token || token.length !== 64) {
      return { 
        valid: false, 
        message: this.i18n.t('activation.invalidFormat', { lang: language }) as string,
      };
    }

    const redisKey = `activation:${token}`;
    const userId = await this.redis.get(redisKey);

    if (!userId) {
      return { 
        valid: false, 
        message: this.i18n.t('activation.tokenExpired', { lang: language }) as string,
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'emailVerified', 'status'],
    });

    if (!user) {
      await this.redis.del(redisKey);
      return { 
        valid: false, 
        message: this.i18n.t('user.notFound', { lang: language }) as string,
      };
    }

    if (user.emailVerified && user.isActive()) {
      await this.redis.del(redisKey);
      return { 
        valid: false, 
        message: this.i18n.t('activation.alreadyActivated', { lang: language }) as string,
      };
    }

    return { 
      valid: true, 
      message: this.i18n.t('activation.tokenValid', { lang: language }) as string,
      email: user.email,
    };
  }

  // ==================== RECUPERACIÓN DE CONTRASEÑA ====================

  async forgotPassword(
    forgotDto: ForgotPasswordDto,
    lang?: string,
  ): Promise<{ message: string }> {
    const { email } = forgotDto;
    const language = this.normalizeLang(lang);

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      this.logger.warn(`Recuperación para email no registrado: ${email}`);
      return {
        message: this.i18n.t('password.resetLinkSent', { lang: language }) as string,
      };
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        this.i18n.t('activation.emailNotVerified', { lang: language }) as string,
      );
    }

    // Rate limiting
    const rateLimitKey = `forgot:${email.toLowerCase()}`;
    const rateLimitExists = await this.redis.exists(rateLimitKey);

    if (rateLimitExists) {
      throw new BadRequestException(
        this.i18n.t('password.rateLimitExceeded', {
          lang: language,
          args: { minutes: 5 },
        }) as string,
      );
    }

    // Generar token
    const resetToken = this.cryptoService.generateToken(32);
    const hashedToken = this.cryptoService.hashData(resetToken);

    const redisKey = `reset:${hashedToken}`;
    await this.redis.setex(redisKey, 3600, user.id.toString()); // 1 hora
    await this.redis.setex(rateLimitKey, 300, '1'); // 5 minutos

    // ✅ ENVIAR EMAIL - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      user.email,
      'PASSWORD_RESET',
      {
        firstName: user.firstName,
        token: resetToken,
        expiresIn: 60,
      },
      language,
      {
        priority: 8,
        attempts: 5,
      },
    );

    this.logger.log(`Link de recuperación enviado: ${email} (idioma: ${language})`);

    return {
      message: this.i18n.t('password.resetLinkSent', { lang: language }) as string,
    };
  }

  // ==================== RESETEAR CONTRASEÑA ====================

  async resetPassword(
    resetDto: ResetPasswordDto,
    lang?: string,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetDto;
    const language = this.normalizeLang(lang);

    const hashedToken = this.cryptoService.hashData(token);
    const redisKey = `reset:${hashedToken}`;

    const userId = await this.redis.get(redisKey);

    if (!userId) {
      throw new BadRequestException(
        this.i18n.t('password.tokenInvalid', { lang: language }) as string,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('user.notFound', { lang: language }) as string,
      );
    }

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    await this.redis.del(redisKey);

    // ✅ ENVIAR NOTIFICACIÓN - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      user.email,
      'PASSWORD_CHANGED',
      {
        firstName: user.firstName,
      },
      language,
    );

    this.logger.log(`Contraseña reseteada: ${user.email} (idioma: ${language})`);

    return {
      message: this.i18n.t('password.changed', { lang: language }) as string,
    };
  }

  // ==================== CAMBIAR CONTRASEÑA ====================

  async changePassword(
    userId: string,
    changeDto: ChangePasswordDto,
    lang?: string,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changeDto;
    const language = this.normalizeLang(lang);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password', 'firstName'],
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('user.notFound', { lang: language }) as string,
      );
    }

    const isPasswordValid = await this.cryptoService.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('password.currentIncorrect', { lang: language }) as string,
      );
    }

    const isSamePassword = await this.cryptoService.verifyPassword(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        this.i18n.t('password.mustBeDifferent', { lang: language }) as string,
      );
    }

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    // ✅ ENVIAR NOTIFICACIÓN - Se encola automáticamente
    await this.mailService.sendTemplatedEmail(
      user.email,
      'PASSWORD_CHANGED',
      {
        firstName: user.firstName,
      },
      language,
    );

    this.logger.log(`Contraseña cambiada: ${user.email} (idioma: ${language})`);

    return {
      message: this.i18n.t('password.changed', { lang: language }) as string,
    };
  }

  // ==================== VALIDAR TOKEN DE RESET ====================

  async validateResetToken(
    token: string,
    lang?: string,
  ): Promise<{ valid: boolean; message: string }> {
    const language = this.normalizeLang(lang);

    const hashedToken = this.cryptoService.hashData(token);
    const redisKey = `reset:${hashedToken}`;

    const userId = await this.redis.get(redisKey);

    if (!userId) {
      return { 
        valid: false, 
        message: this.i18n.t('password.tokenInvalid', { lang: language }) as string,
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      await this.redis.del(redisKey);
      return { 
        valid: false, 
        message: this.i18n.t('password.tokenInvalid', { lang: language }) as string,
      };
    }

    return { 
      valid: true, 
      message: this.i18n.t('password.tokenValid', { lang: language }) as string,
    };
  }
}