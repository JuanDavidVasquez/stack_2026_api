import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index(['user', 'isRevoked', 'expiresAt'])
export class RefreshToken extends BaseEntity {
  @Column({ type: 'varchar', length: 500 })
  @Index()
  tokenHash: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revokeReason: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  replacedByTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  replacedAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  createdByIp: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  revokedByIp: string | null;

  isActive(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  revoke(reason: string, ip?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokeReason = reason;
    this.revokedByIp = ip || null;
  }

  replaceBy(newTokenHash: string): void {
    this.replacedByTokenHash = newTokenHash;
    this.replacedAt = new Date();
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokeReason = 'Replaced by token rotation';
  }

  daysUntilExpiration(): number {
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}