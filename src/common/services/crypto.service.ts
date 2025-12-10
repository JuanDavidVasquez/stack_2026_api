import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes, scrypt, CipherGCM } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm: string;
  private readonly secretKey: string;
  private readonly bcryptRounds: number;

  constructor(private readonly configService: ConfigService) {
    const algorithm = this.configService.get<string>('crypto.algorithm');
    if (!algorithm) {
      throw new Error('CRYPTO_ALGORITHM no configurado o inválido');
    }
    this.algorithm = algorithm;

    const secretKey = this.configService.get<string>('crypto.secretKey');
    if (!secretKey) {
      throw new Error('CRYPTO_SECRET_KEY no configurado o inválido');
    }
    this.secretKey = secretKey;
    this.bcryptRounds = this.configService.get<number>('crypto.bcryptRounds') ?? 10;

    if (!this.secretKey || this.secretKey.length < 32) {
      throw new Error('CRYPTO_SECRET_KEY no configurado o inválido');
    }
  }

  // ==================== HASHING (Passwords) ====================

  /**
   * Hashea una contraseña con bcrypt
   * @param password - Contraseña en texto plano
   * @returns Hash de la contraseña
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.bcryptRounds);
    } catch (error) {
      this.logger.error('Error al hashear contraseña', error.stack);
      throw new Error('Error al procesar la contraseña');
    }
  }

  /**
   * Verifica una contraseña contra su hash
   * @param plainPassword - Contraseña en texto plano
   * @param hashedPassword - Hash almacenado
   * @returns true si coinciden, false si no
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Error al verificar contraseña', error.stack);
      return false;
    }
  }

  // ==================== ENCRIPTACIÓN (Datos sensibles) ====================

  /**
   * Encripta texto usando AES-256-GCM
   * @param text - Texto a encriptar
   * @returns Texto encriptado en formato: iv:encryptedData:authTag
   */
  async encrypt(text: string): Promise<string> {
    try {
      // Generar IV (Initialization Vector)
      const iv = randomBytes(16);

      // Derivar key desde secret
      const key = (await scryptAsync(this.secretKey, 'salt', 32)) as Buffer;

      // Crear cipher
      const cipher = createCipheriv(this.algorithm, key, iv);

      // Encriptar
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Obtener auth tag (solo para GCM)
      const authTag = this.algorithm === 'aes-256-gcm' 
        ? (cipher as CipherGCM).getAuthTag().toString('hex') 
        : '';

      // Formato: iv:encryptedData:authTag
      return `${iv.toString('hex')}:${encrypted}${authTag ? ':' + authTag : ''}`;

    } catch (error) {
      this.logger.error('Error al encriptar', error.stack);
      throw new Error('Error al encriptar datos');
    }
  }

  /**
   * Desencripta texto encriptado con AES-256-GCM
   * @param encryptedText - Texto encriptado en formato: iv:encryptedData:authTag
   * @returns Texto desencriptado
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Separar componentes
      const parts = encryptedText.split(':');
      
      if (parts.length < 2) {
        throw new Error('Formato de encriptación inválido');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = parts[2] ? Buffer.from(parts[2], 'hex') : null;

      // Derivar key
      const key = (await scryptAsync(this.secretKey, 'salt', 32)) as Buffer;

      // Crear decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);

      // Establecer auth tag (solo para GCM)
      if (this.algorithm === 'aes-256-gcm' && authTag) {
        (decipher as import('crypto').DecipherGCM).setAuthTag(authTag);
      }

      // Desencriptar
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      this.logger.error('Error al desencriptar', error.stack);
      throw new Error('Error al desencriptar datos');
    }
  }

  // ==================== HASH (Datos no sensibles) ====================

  /**
   * Genera un hash SHA-256 de un texto
   * Útil para tokens, IDs únicos, etc.
   * @param text - Texto a hashear
   * @returns Hash en formato hexadecimal
   */
  hashData(text: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Genera un token aleatorio seguro
   * @param length - Longitud del token en bytes (default: 32)
   * @returns Token en formato hexadecimal
   */
  generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Genera un código numérico aleatorio
   * Útil para códigos de verificación
   * @param digits - Número de dígitos (default: 6)
   * @returns Código numérico
   */
  generateNumericCode(digits: number = 6): string {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}