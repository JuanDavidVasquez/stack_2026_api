/**
 * Roles de usuario en el sistema
 * 
 * Define los diferentes niveles de acceso y permisos
 */
export enum UserRole {
  /**
   * Administrador del sistema - Acceso total
   */
  ADMIN = 'admin',

  /**
   * Usuario estándar - Acceso limitado
   */
  USER = 'user',

  /**
   * Moderador - Permisos intermedios
   */
  MODERATOR = 'moderator',

  /**
   * Usuario invitado - Acceso de solo lectura
   */
  GUEST = 'guest',
}