import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  IsUrl,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum para idiomas soportados
 */
export enum EmailLanguage {
  EN = 'en',
  ES = 'es',
  PT = 'pt',
}

/**
 * DTO base para emails
 */
export class BaseEmailDto {
  @ApiProperty({
    description: 'Email del destinatario',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'validation.isEmail' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  email: string;

  @ApiPropertyOptional({
    description: 'Idioma del email',
    enum: EmailLanguage,
    default: EmailLanguage.EN,
    example: EmailLanguage.ES,
  })
  @IsOptional()
  @IsEnum(EmailLanguage, { message: 'validation.isEnum' })
  lang?: EmailLanguage = EmailLanguage.EN;
}

/**
 * DTO para email de bienvenida
 */
export class SendWelcomeEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(2, { message: 'validation.minLength' })
  @MaxLength(100, { message: 'validation.maxLength' })
  userName: string;
}

/**
 * DTO para email de restablecimiento de contraseña
 */
export class SendPasswordResetEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(2, { message: 'validation.minLength' })
  @MaxLength(100, { message: 'validation.maxLength' })
  userName: string;

  @ApiProperty({
    description: 'Token de restablecimiento de contraseña',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  resetToken: string;
}

/**
 * DTO para email de verificación de cuenta
 */
export class SendVerificationEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(2, { message: 'validation.minLength' })
  @MaxLength(100, { message: 'validation.maxLength' })
  userName: string;

  @ApiProperty({
    description: 'Token de verificación',
    example: 'abc123xyz789',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  verificationToken: string;
}

/**
 * DTO para email de notificación de cambio de contraseña
 */
export class SendPasswordChangedEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(2, { message: 'validation.minLength' })
  @MaxLength(100, { message: 'validation.maxLength' })
  userName: string;
}

/**
 * DTO para información de dispositivo
 */
export class DeviceInfoDto {
  @ApiProperty({
    description: 'Tipo de dispositivo',
    example: 'Desktop',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  device: string;

  @ApiProperty({
    description: 'Navegador utilizado',
    example: 'Chrome 120',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  browser: string;

  @ApiProperty({
    description: 'Dirección IP',
    example: '192.168.1.1',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  ip: string;

  @ApiPropertyOptional({
    description: 'Ubicación aproximada',
    example: 'Bogotá, Colombia',
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  location?: string;
}

/**
 * DTO para email de inicio de sesión desde nuevo dispositivo
 */
export class SendNewDeviceLoginEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(2, { message: 'validation.minLength' })
  @MaxLength(100, { message: 'validation.maxLength' })
  userName: string;

  @ApiProperty({
    description: 'Información del dispositivo',
    type: DeviceInfoDto,
  })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  deviceInfo: DeviceInfoDto;
}

/**
 * DTO para adjunto de email
 */
export class EmailAttachmentDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'invoice.pdf',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  filename: string;

  @ApiPropertyOptional({
    description: 'Ruta del archivo o contenido base64',
    example: '/path/to/file.pdf o data:application/pdf;base64,...',
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  path?: string;

  @ApiPropertyOptional({
    description: 'Contenido del archivo en buffer',
  })
  @IsOptional()
  content?: Buffer | string;

  @ApiPropertyOptional({
    description: 'Tipo MIME del archivo',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  contentType?: string;
}

/**
 * DTO para email personalizado
 */
export class SendCustomEmailDto extends BaseEmailDto {
  @ApiProperty({
    description: 'Asunto del email',
    example: 'Importante: Actualización de términos y condiciones',
    minLength: 5,
    maxLength: 200,
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(5, { message: 'validation.minLength' })
  @MaxLength(200, { message: 'validation.maxLength' })
  subject: string;

  @ApiProperty({
    description: 'Ruta de la plantilla (sin extensión .hbs)',
    example: 'custom/notification',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  templatePath: string;

  @ApiProperty({
    description: 'Contexto/variables para la plantilla',
    example: { title: 'Hola', message: 'Este es un mensaje personalizado' },
  })
  @IsObject({ message: 'validation.isObject' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  context: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Lista de adjuntos',
    type: [EmailAttachmentDto],
  })
  @IsOptional()
  @IsArray({ message: 'validation.isArray' })
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Destinatarios en copia (CC)',
    example: ['manager@example.com'],
  })
  @IsOptional()
  @IsArray({ message: 'validation.isArray' })
  @IsEmail({}, { each: true, message: 'validation.isEmail' })
  cc?: string[];

  @ApiPropertyOptional({
    description: 'Destinatarios en copia oculta (BCC)',
    example: ['admin@example.com'],
  })
  @IsOptional()
  @IsArray({ message: 'validation.isArray' })
  @IsEmail({}, { each: true, message: 'validation.isEmail' })
  bcc?: string[];
}

/**
 * DTO para envío masivo de emails
 */
export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Lista de destinatarios',
    example: ['user1@example.com', 'user2@example.com'],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'validation.isArray' })
  @ArrayMinSize(1, { message: 'validation.arrayMinSize' })
  @ArrayMaxSize(100, { message: 'validation.arrayMaxSize' })
  @IsEmail({}, { each: true, message: 'validation.isEmail' })
  recipients: string[];

  @ApiProperty({
    description: 'Asunto del email',
    example: 'Boletín mensual',
    minLength: 5,
    maxLength: 200,
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @MinLength(5, { message: 'validation.minLength' })
  @MaxLength(200, { message: 'validation.maxLength' })
  subject: string;

  @ApiProperty({
    description: 'Ruta de la plantilla',
    example: 'newsletter/monthly',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  template: string;

  @ApiProperty({
    description: 'Contexto para la plantilla',
    example: { month: 'Enero', year: 2024 },
  })
  @IsObject({ message: 'validation.isObject' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  context: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Idioma del email',
    enum: EmailLanguage,
    default: EmailLanguage.EN,
  })
  @IsOptional()
  @IsEnum(EmailLanguage, { message: 'validation.isEnum' })
  lang?: EmailLanguage = EmailLanguage.EN;
}

/**
 * DTO para preview de email (solo desarrollo)
 */
export class PreviewEmailDto {
  @ApiProperty({
    description: 'Ruta de la plantilla a previsualizar',
    example: 'welcome/welcome.es',
  })
  @IsString({ message: 'validation.isString' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  template: string;

  @ApiProperty({
    description: 'Contexto para la plantilla',
    example: { userName: 'Juan', appName: 'MyApp' },
  })
  @IsObject({ message: 'validation.isObject' })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  context: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Idioma del preview',
    enum: EmailLanguage,
    default: EmailLanguage.EN,
  })
  @IsOptional()
  @IsEnum(EmailLanguage, { message: 'validation.isEnum' })
  lang?: EmailLanguage = EmailLanguage.EN;
}

/**
 * DTO de respuesta para operaciones de email
 */
export class EmailResponseDto {
  @ApiProperty({
    description: 'Indica si el email fue enviado exitosamente',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'ID del mensaje enviado',
    example: '<abc123@mail.example.com>',
  })
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Mensaje de error si falló el envío',
    example: 'SMTP connection timeout',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Email del destinatario',
    example: 'user@example.com',
  })
  recipient?: string;
}

/**
 * DTO de respuesta para envío masivo
 */
export class BulkEmailResponseDto {
  @ApiProperty({
    description: 'Total de emails a enviar',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Emails enviados exitosamente',
    example: 48,
  })
  successful: number;

  @ApiProperty({
    description: 'Emails fallidos',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'Detalle de cada envío',
    type: [EmailResponseDto],
  })
  results: EmailResponseDto[];
}