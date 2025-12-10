import { Entity, Column, Index, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RefreshToken } from './refresh-token.entity';
import { UserRole, UserStatus } from '../enums';

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
    length: 255,
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
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'first_name',
  })
  firstName: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'last_name',
  })
  lastName: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @Index()
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @Index()
  status: UserStatus;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatar: string | null;

  @Column({
    type: 'boolean',
    default: false,
    name: 'email_verified',
  })
  emailVerified: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'email_verified_at',
  })
  emailVerifiedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_login_at',
  })
  lastLoginAt: Date | null;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'last_login_ip',
  })
  lastLoginIp: string | null;

  @Column({
    type: 'int',
    default: 0,
    name: 'login_attempts',
  })
  loginAttempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'locked_until',
  })
  lockedUntil: Date | null;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @BeforeInsert()
  generateUsername() {
    if (!this.username && this.email) {
      const emailPrefix = this.email.split('@')[0];
      const cleanPrefix = emailPrefix
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      const timestamp = Date.now().toString().slice(-6);
      this.username = `${cleanPrefix}${timestamp}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeUsername() {
    if (this.username) {
      this.username = this.username.toLowerCase().trim();
    }
  }

  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked();
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  lockAccount(minutes: number = 30): void {
    this.lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
  }

  unlockAccount(): void {
    this.lockedUntil = null;
    this.loginAttempts = 0;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
  }

  updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip || null;
    this.resetLoginAttempts();
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.emailVerifiedAt = new Date();
    if (this.status === UserStatus.PENDING) {
      this.status = UserStatus.ACTIVE;
    }
  }
}