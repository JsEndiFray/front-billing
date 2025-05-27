import {Injectable} from '@angular/core';
import {User} from '../../../interface/users-interface';

@Injectable({
  providedIn: 'root'
})
export class UserValidatorService {

  constructor() {
  }

  //Limpiar y transformar datos
  cleanUserData(user: User): User {
    return {
      id: user.id,
      username: user.username.toLowerCase().trim(),
      password: user.password.trim(),
      confirm_password: user.confirm_password?.trim(),
      email: user.email.toLowerCase().trim(),
      phone: user.phone.trim(),
      role: user.role.trim(),
    } as User;
  }

  // Validar campos requeridos
  validateRequiredFields(user: User): { isValid: boolean; message?: string } {
    if (!user.username ||
      !user.password ||
      !user.email ||
      !user.phone) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }
    return {isValid: true};
  }

  //validacion password
  validatePasswords(password: string, confirmPassword: string): { isValid: boolean; message?: string } {
    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: "Las contraseñas no coinciden"
      };
    }
    return {isValid: true};
  }

  // Comprobar si se ha seleccionado un rol
  validateRole(role: string): { isValid: boolean; message?: string } {
    if (!role || role === '') {
      return {
        isValid: false,
        message: "Debe seleccionar un rol"
      };
    }
    ;
    return {isValid: true};
  }

  //cambiar el nombre de español a ingles al backend
  transformRoleToBackend(role: string) {
    if (role === 'empleado') return 'employee';
    if (role === 'administrador') return 'admin';
    return role;
  }

  //Validación completa
  validateUser(user: User): { isValid: boolean; message?: string } {
    // 1. LIMPIAR datos
    const cleanUser = this.cleanUserData(user);

    // 2. VALIDAR campos requeridos
    const requiredValidation = this.validateRequiredFields(cleanUser);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }
    // 3. VALIDAR contraseñas (si existe confirm_password)
    if (cleanUser.confirm_password !== undefined) {
      const passwordValidation = this.validatePasswords(cleanUser.password, cleanUser.confirm_password);
      if (!passwordValidation.isValid) {
        return passwordValidation;
      }
    }
    // 4. VALIDAR rol
    const roleValidation = this.validateRole(cleanUser.role);
    if (!roleValidation.isValid) {
      return roleValidation;
    }
    return {isValid: true};
  }

}
