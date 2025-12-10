import { UserRole, UserStatus } from "../enums";


export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  loginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ICreateUser {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
}

export interface IUpdateUser {
  id: string;
  email?: string;
  password?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  avatar?: string;
}

export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile extends IUserResponse {
  lastLoginIp: string | null;
  loginAttempts: number;
  isLocked: boolean;
}