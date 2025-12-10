import { IsOptional, IsEmail, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser válido' })
  email?: string;

  @IsOptional()
  username?: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'status debe ser active, inactive o suspended' })
  status?: UserStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isEmailVerified debe ser un booleano' })
  isEmailVerified?: boolean;

  // Búsqueda general (busca en email, username, firstName, lastName)
  @IsOptional()
  search?: string;
}