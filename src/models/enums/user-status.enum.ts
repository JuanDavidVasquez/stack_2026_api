/**
 * Estados del usuario
 * 
 * Representa el estado actual de la cuenta del usuario
 */
export enum UserStatus {
  /**
   * Usuario activo - Puede usar el sistema normalmente
   */
  ACTIVE = 'active',

  /**
   * Usuario inactivo - Cuenta desactivada temporalmente
   */
  INACTIVE = 'inactive',

  /**
   * Cuenta pendiente de verificación
   */
  PENDING = 'pending',

  /**
   * Usuario suspendido - No puede acceder al sistema
   */
  SUSPENDED = 'suspended',

  /**
   * Cuenta bloqueada por razones de seguridad
   */
  BLOCKED = 'blocked',
}