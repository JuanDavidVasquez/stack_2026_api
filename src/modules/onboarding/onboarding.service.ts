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
import Redis from 'ioredis';
import { I18nService } from 'nestjs-i18n';

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

  private normalizeLang(lang: string): string {
    if (!lang) return 'es';
    return lang.split(',')[0].split('-')[0].trim().toLowerCase();
  }

  private getEmailBaseContext() {
    return {
      appName: 'OneLesson',
      year: new Date().getFullYear(),
      companyName: 'OneLesson',
      logoUrl: 'https://via.placeholder.com/140x40?text=OneLesson',
      privacyUrl: '#',
      termsUrl: '#',
    };
  }

  private async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('user.notFound');
    return user;
  }

  // ==================== REGISTRO ====================

  async register(registerDto: RegisterDto, lang = 'es') {
    lang = this.normalizeLang(lang);

    const { email, password, firstName, lastName, phone, username } = registerDto;

    if (await this.userRepository.findOne({ where: { email: email.toLowerCase() } }))
      throw new ConflictException('user.emailExists');

    if (await this.userRepository.findOne({ where: { username: username.toLowerCase() } }))
      throw new ConflictException('user.usernameExists');

    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: await this.cryptoService.hashPassword(password),
      firstName,
      lastName,
      phone,
      username,
      isActive: false,
      emailVerified: false,
      role: UserRole.USER,
    });

    await this.userRepository.save(user);

    const code = this.cryptoService.generateNumericCode(6);
    await this.redis.setex(`verification:${email.toLowerCase()}`, 900, code);

    const subject = this.i18n.t('user.email.verification.subject', { lang }) as string;
    
    await this.mailService.queueEmail({
      to: email,
      subject,
      template: `verification-code/verification-code.${lang}.hbs`,
      context: {
        name: firstName,
        code,
        actionUrl: `${this.configService.get('frontendUrl')}/login`,
        expiresIn: 15,
        ...this.getEmailBaseContext(),
      },
    });

    return { message: 'user.registered', email: email.toLowerCase() };
  }

  // ==================== VERIFICACIÓN DE EMAIL ====================

  async verifyEmail(verifyEmailDto: VerifyEmailDto, lang = 'es') {
    lang = this.normalizeLang(lang);
    const { email, verificationCode } = verifyEmailDto;

    const storedCode = await this.redis.get(`verification:${email.toLowerCase()}`);
    if (!storedCode) throw new BadRequestException('verification.codeInvalid');
    if (storedCode !== verificationCode) throw new BadRequestException('verification.codeIncorrect');

    const user = await this.getUserByEmail(email);

    if (user.emailVerified) throw new BadRequestException('verification.alreadyVerified');

    user.emailVerified = true;
    user.isActive = () => true;
    user.emailVerifiedAt = new Date();
    await this.userRepository.save(user);
    await this.redis.del(`verification:${email.toLowerCase()}`);

    const subject = this.i18n.t('email.welcome.subject', {
      lang,
      args: { name: user.firstName },
    }) as string;

    await this.mailService.queueEmail({
      to: email,
      subject,
      template: `welcome/welcome.${lang}.hbs`,
      context: {
        name: user.firstName,
        loginUrl: `${this.configService.get('frontendUrl')}/login`,
        ...this.getEmailBaseContext(),
      },
    });

    return { message: 'verification.success' };
  }

  // ==================== REENVIAR VERIFICACIÓN ====================

  async resendVerification(resendDto: ResendVerificationDto, lang = 'es') {
    lang = this.normalizeLang(lang);
    const { email } = resendDto;

    const user = await this.getUserByEmail(email);
    if (user.emailVerified) throw new BadRequestException('verification.alreadyVerified');

    const code = this.cryptoService.generateNumericCode(6);
    await this.redis.setex(`verification:${email.toLowerCase()}`, 900, code);

    const subject = this.i18n.t('user.email.verification.subject', { lang }) as string;

    await this.mailService.queueEmail({
      to: email,
      subject,
      template: `verification-code/verification-code.${lang}.hbs`,
      context: {
        name: user.firstName,
        code,
        actionUrl: `${this.configService.get('frontendUrl')}/login`,
        expiresIn: 15,
        ...this.getEmailBaseContext(),
      },
    });

    return { message: 'verification.resent' };
  }

  // ==================== OLVIDÉ MI CONTRASEÑA ====================

  async forgotPassword(forgotDto: ForgotPasswordDto, lang = 'es') {
    lang = this.normalizeLang(lang);
    const { email } = forgotDto;

    const user = await this.getUserByEmail(email);

    const code = this.cryptoService.generateNumericCode(6);
    await this.redis.setex(`reset:${email.toLowerCase()}`, 900, code);

    const subject = this.i18n.t('email.passwordReset.subject', { lang }) as string;

    await this.mailService.queueEmail({
      to: email,
      subject,
      template: `reset-password/reset-password.${lang}.hbs`,
      context: {
        name: user.firstName,
        code,
        actionUrl: `${this.configService.get('frontendUrl')}/reset-password`,
        expiresIn: 15,
        ...this.getEmailBaseContext(),
      },
    });

    return { message: 'password.resetCodeSent' };
  }

  // ==================== RESTABLECER CONTRASEÑA ====================

  async resetPassword(resetDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetDto;

    const stored = await this.redis.get(`reset:${email.toLowerCase()}`);
    if (!stored || stored !== code) throw new UnauthorizedException('password.invalidCode');

    const user = await this.getUserByEmail(email);
    user.password = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.save(user);

    await this.redis.del(`reset:${email.toLowerCase()}`);
    return { message: 'password.changed' };
  }

  // ==================== CAMBIAR CONTRASEÑA CON SESIÓN ====================

  async changePassword(userId: number, changeDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changeDto;

    const user = await this.userRepository.findOne({ where: { id: userId.toString() } });
    if (!user) throw new NotFoundException('user.notFound');

    const valid = await this.cryptoService.comparePassword(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('auth.invalidPassword');

    user.password = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.save(user);

    return { message: 'password.changed' };
  }

  async validateResetToken(token: string) {
    const email = await this.redis.get(`reset:${token}`);
    if (!email) throw new BadRequestException('password.invalidToken');
    return { message: 'password.tokenValid' };
  }
}
