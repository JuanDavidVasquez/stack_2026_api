import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserStatus } from '../enums/user-status.enum';
import { UserRole } from '../enums';

/**
 * Entidad User
 * Representa un usuario en el sistema
 */
@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    select: false,
  })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({
    type: 'boolean',
    default: false,
    name: 'email_verified',
  })
  emailVerified: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_login',
  })
  lastLogin?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  lastLoginIp?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'avatar',
  })
  avatar?: string;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  isActive: boolean;

  /**
   * 🔧 NUEVO: Genera username automáticamente si no existe
   * Este hook se ejecuta ANTES de insertar en la base de datos
   */
  @BeforeInsert()
  generateUsername() {
    if (!this.username && this.email) {
      // Extraer parte antes del @ del email
      const emailPrefix = this.email.split('@')[0];
      
      // Limpiar y formatear: lowercase, solo alfanuméricos
      const cleanPrefix = emailPrefix
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20); // Limitar a 20 caracteres
      
      // Agregar timestamp para unicidad
      const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
      this.username = `${cleanPrefix}${timestamp}`;
      
      console.log(`🔧 Username auto-generado: ${this.username} (email: ${this.email})`);
    }
  }

  /**
   * Normaliza el email antes de insertar/actualizar
   */
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  /**
   * Normaliza el username antes de insertar/actualizar
   */
  @BeforeInsert()
  @BeforeUpdate()
  normalizeUsername() {
    if (this.username) {
      this.username = this.username.toLowerCase().trim();
    }
  }
}