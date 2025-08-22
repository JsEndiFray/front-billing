import {Injectable} from '@angular/core';
import {User} from '../../../interfaces/users-interface';

/**
 * Servicio de validación para usuarios del sistema
 * Validaciones básicas y transformación de roles
 */
@Injectable({
  providedIn: 'root'
})
export class UserValidatorService {

  constructor() {
  }

  /**
   * Limpia y transforma datos de usuario
   */
  cleanUserData(user: User): User {
    return {
      id: user.id,
      username: user.username?.toLowerCase().trim() || '',
      password: user.password?.trim() || '',
      confirm_password: user.confirm_password?.trim() || '',
      email: user.email?.toLowerCase().trim() || '',
      phone: user.phone?.trim() || '',
      role: user.role?.trim() || '',
    } as User;
  }

  /**
   * Valida campos obligatorios
   */
  validateRequiredFields(user: User): { isValid: boolean; message?: string } {
    if (!user.username ||
      !user.password ||
      !user.email ||
      !user.phone
    ) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }
    return {isValid: true};
  }

  /**
   * Valida coincidencia de contraseñas
   */
  validatePasswords(password: string, confirmPassword: string): { isValid: boolean; message?: string } {
    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: "Las contraseñas no coinciden"
      };
    }
    return {isValid: true};
  }

  /**
   * Valida selección de rol
   */
  validateRole(role: string): { isValid: boolean; message?: string } {
    if (!role || role === '') {
      return {
        isValid: false,
        message: "Debe seleccionar un rol"
      };
    }
    return {isValid: true};
  }

  /**
   * Transforma rol de español a inglés para backend
   */
  transformRoleToBackend(role: string) {
    if (role === 'empleado') return 'employee';
    if (role === 'administrador') return 'admin';
    return role;
  }

  /**
   * Validación completa - orquesta todas las validaciones
   */
  validateUser(user: User): { isValid: boolean; message?: string } {
    const cleanUser = this.cleanUserData(user);

    // Ejecutar validaciones en secuencia
    const requiredValidation = this.validateRequiredFields(cleanUser);
    if (!requiredValidation.isValid) return requiredValidation;

    // Validar contraseñas si existe confirmación
    if (cleanUser.confirm_password !== undefined) {
      const passwordValidation = this.validatePasswords(cleanUser.password, cleanUser.confirm_password);
      if (!passwordValidation.isValid) return passwordValidation;

    }

    const roleValidation = this.validateRole(cleanUser.role);
    if (!roleValidation.isValid) return roleValidation;

    return {isValid: true};
  }
}
