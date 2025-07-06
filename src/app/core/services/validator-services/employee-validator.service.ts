import {Injectable} from '@angular/core';
import {Employee} from '../../../interface/employee-interface';

/**
 * Servicio de validación para propietarios
 * Incluye sanitización y validación de documentos españoles (NIF, NIE, pasaporte)
 */

@Injectable({
  providedIn: 'root'
})
export class EmployeeValidatorServices {

  constructor() {
  }

  /**
   * Limpia y transforma datos de empleado
   */
  cleanEmployeeData(employee: Employee): Employee {
    return {
      id: employee.id,
      name: employee.name?.toUpperCase().trim() || '',
      lastname: employee.lastname?.toUpperCase().trim() || '',
      email: employee.email?.toLowerCase().trim() || '',
      identification: employee.identification?.toUpperCase().trim() || '',
      phone: employee.phone?.trim() || '',
      address: employee.address?.toUpperCase().trim() || '',
      postal_code: employee.postal_code?.trim() || '',
      location: employee.location?.toUpperCase().trim() || '',
      province: employee.province?.toUpperCase().trim() || '',
      country: employee.country?.toUpperCase().trim() || '',
    } as Employee;
  }

  /**
   * Valida campos obligatorios
   */
  validateRequiredFields(employee: Employee): { isValid: boolean, message?: string } {

    if (
      !employee.name ||
      !employee.lastname ||
      !employee.email ||
      !employee.identification ||
      !employee.phone ||
      !employee.address ||
      !employee.postal_code ||
      !employee.location ||
      !employee.province ||
      !employee.country
    ) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }
    return {isValid: true}
  }

  /**
   * Valida NIF con algoritmo de letra de control
   */
  private validateNIF(nif: string): boolean {
    if (!nif || nif.length !== 9) return false;

    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nifRegex.test(nif)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(nif.substring(0, 8));
    const letter = nif.charAt(8);

    return letter === letters.charAt(number % 23);
  }

  /**
   * Valida NIE con conversión a NIF equivalente
   */
  private validateNIE(nie: string): boolean {
    if (!nie || nie.length !== 9) return false;

    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nieRegex.test(nie)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let number = nie.substring(1, 8);

    // Convertir prefijo a número
    if (nie.charAt(0) === 'Y') number = '1' + number;
    else if (nie.charAt(0) === 'Z') number = '2' + number;
    else number = '0' + number;

    const letter = nie.charAt(8);
    return letter === letters.charAt(parseInt(number) % 23);
  }

  /**
   * Valida formato de pasaporte básico
   */
  private validatePassport(passport: string): boolean {
    if (!passport || passport.length < 6 || passport.length > 9) return false;
    const passportRegex = /^[A-Z0-9]{6,9}$/;
    return passportRegex.test(passport.toUpperCase());
  }

  /**
   * Valida identificación (NIF, NIE o pasaporte)
   */
  validateIdentification(identification: string): { isValid: boolean, message?: string } {
    if (!identification || identification.trim() === '') {
      return {isValid: false, message: 'La identificación es obligatoria'}
    }
    const cleanId = identification.toUpperCase().trim();
    if (!this.validateNIF(cleanId) &&
      !this.validateNIE(cleanId) &&
      !this.validatePassport(cleanId)
    ) {
      return {
        isValid: false,
        message: 'Debe ser un NIF, NIE o Pasaporte válido'
      }
    }
    return {isValid: true}
  }

  // Validaciones específicas
  validateEmail(email: string): { isValid: boolean, message?: string } {
    if (!email || email.trim() === '') {
      return {isValid: false, message: 'El email es obligatorio'};
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {isValid: false, message: 'El formato del email no es válido'}
    }
    return {isValid: true};
  }

  validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone || phone.trim() === '') {
      return {isValid: false, message: 'El teléfono es obligatorio'};
    }
    // Teléfonos españoles: empiezan por 6, 7, 8 o 9
    const phoneRegex = /^[6-9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return {isValid: false, message: 'El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9'};
    }
    return {isValid: true}
  }

  validatePostalCode(postal_code: string): { isValid: boolean; message?: string } {
    if (!postal_code || postal_code.trim() === '') {
      return {isValid: false, message: 'El código postal es obligatorio'};
    }
    const postalRegex = /^[0-9]{5}$/;
    if (!postalRegex.test(postal_code)) {
      return {isValid: false, message: 'El código postal debe tener 5 dígitos'};
    }
    return {isValid: true};
  }

  /**
   * Validación completa - orquesta todas las validaciones
   */
  validateEmployee(employee: Employee): { isValid: boolean; message?: string } {

    const cleanEmployee = this.cleanEmployeeData(employee);

    const requiredValidation = this.validateRequiredFields(cleanEmployee);
    if (!requiredValidation.isValid) return requiredValidation;

    const idValidate = this.validateIdentification(employee.identification)
    if (!idValidate.isValid) return idValidate;

    const emailValidate = this.validateEmail(employee.email);
    if (!emailValidate.isValid) return emailValidate;

    const phoneValidate = this.validatePhone(employee.phone);
    if (!phoneValidate.isValid) return phoneValidate;

    const postalValidation = this.validatePostalCode(employee.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true}
  }


}
