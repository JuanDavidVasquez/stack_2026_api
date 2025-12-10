import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../models/enums/user-role.enum';
import { UserStatus } from '../../../models/enums/user-status.enum';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  status: UserStatus;

  @Expose()
  emailVerified: boolean;

  @Expose()
  avatar?: string;

  @Expose()
  lastLogin?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  offset?: number;

  @Expose()
  limit?: number;

  @Expose()
  total?: number;
}