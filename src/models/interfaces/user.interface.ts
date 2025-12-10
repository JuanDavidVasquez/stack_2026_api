import { UserRole } from "../enums";
import { UserStatus } from "../enums/user-status.enum";



/**
 * Interface para el objeto User
 * 
 * Define la estructura de datos de un usuario
 */
export interface IUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Interface para crear un nuevo usuario
 * Omite campos autogenerados
 */
export interface ICreateUser {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Interface para actualizar un usuario
 * Todos los campos son opcionales excepto el id
 */
export interface IUpdateUser {
  id: string;
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
}

/**
 * Interface para respuesta de usuario
 * Datos públicos del usuario
 */
export interface IUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}