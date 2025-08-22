import {Injectable} from '@angular/core';
import {Owners} from '../../../interfaces/owners-interface';

/**
 * Servicio de validación para propietarios
 * Incluye sanitización y validación de documentos españoles (NIF, NIE, pasaporte)
 */
@Injectable({
  providedIn: 'root'
})
export class OwnersValidatorService {

  constructor() {}

  /**
   * Limpia y transforma datos de propietario
   */
  cleanOwnerData(owners: Owners): Owners {
    return {
      id: owners.id,
      name: owners.name?.toUpperCase().trim() || '',
      lastname: owners.lastname?.toUpperCase().trim() || '',
      email: owners.email?.toLowerCase().trim() || '',
      identification: owners.identification?.toUpperCase().trim() || '',
      phone: owners.phone?.trim() || '',
      address: owners.address?.toUpperCase().trim() || '',
      postal_code: owners.postal_code?.trim() || '',
      location: owners.location?.toUpperCase().trim() || '',
      province: owners.province?.toUpperCase().trim() || '',
      country: owners.country?.toUpperCase().trim() || '',
    } as Owners;
  }

  /**
   * Valida campos obligatorios
   */
  validateRequiredFields(owner: Owners): { isValid: boolean; message?: string } {
    if (
      !owner.name ||
      !owner.lastname ||
      !owner.email||
      !owner.identification ||
      !owner.phone ||
      !owner.address ||
      !owner.postal_code ||
      !owner.location ||
      !owner.province ||
      !owner.country
    ) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }
    return {isValid: true};
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
  validateIdentification(identification: string): { isValid: boolean; message?: string } {
    if (!identification || identification.trim() === '') {
      return {isValid: false, message: 'La identificación es obligatoria'}
    }

    const cleanId = identification.toUpperCase().trim();

    if (!this.validateNIE(cleanId) &&
      !this.validateNIF(cleanId) &&
      !this.validatePassport(cleanId)
    ) {
      return {
        isValid: false,
        message: 'Debe ser un NIF, NIE o Pasaporte válido'
      }
    }
    return {isValid: true};
  }

  // Validaciones específicas
  validateEmail(email: string): { isValid: boolean; message?: string } {
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
  validateOwners(owners: Owners): { isValid: boolean; message?: string } {
    const cleanOwner = this.cleanOwnerData(owners);

    // Ejecutar validaciones en secuencia
    const requiredValidation = this.validateRequiredFields(cleanOwner);
    if (!requiredValidation.isValid) return requiredValidation;

    const idValidate = this.validateIdentification(cleanOwner.identification);
    if (!idValidate.isValid) return idValidate;

    const emailValidate = this.validateEmail(cleanOwner.email);
    if (!emailValidate.isValid) return emailValidate;

    const phoneValidate = this.validatePhone(cleanOwner.phone);
    if (!phoneValidate.isValid) return phoneValidate;

    const postalValidation = this.validatePostalCode(cleanOwner.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true};
  }
}
