import {Injectable} from '@angular/core';
import {Clients} from '../../../interfaces/clientes-interface';

/**
 * Servicio de validación para clientes
 * Incluye sanitización de datos y validación de documentos españoles
 */
@Injectable({
  providedIn: 'root'
})
export class ClientsValidatorService {

  /**
   * Limpia y transforma datos de cliente
   */
  cleanClientData(client: Clients): Clients {
    return {
      ...client,
      type_client: client.type_client?.trim() || '',
      name: client.name?.toUpperCase().trim() || '',
      lastname: client.lastname?.toUpperCase().trim() || '',
      company_name: client.company_name?.toUpperCase().trim() || '',
      identification: client.identification?.toUpperCase().trim() || '',
      phone: client.phone?.trim() || '',
      email: client.email?.toLowerCase().trim() || '',
      address: client.address?.toUpperCase().trim() || '',
      postal_code: client.postal_code?.trim() || '',
      location: client.location?.toUpperCase().trim() || '',
      province: client.province?.toUpperCase().trim() || '',
      country: client.country?.toUpperCase().trim() || ''
    } as Clients;
  }

  /**
   * Valida campos obligatorios
   */
  validateRequiredFields(client: Clients): { isValid: boolean; message?: string } {
    if (!client.name||
      !client.lastname ||
      !client.identification ||
      !client.phone ||
      !client.email ||
      !client.address ||
      !client.postal_code ||
      !client.location ||
      !client.province ||
      !client.country) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios'
      };
    }
    return {isValid: true};
  }

  /**
   * Valida CIF para empresas con algoritmo de dígito de control
   */
  private validateCIF(cif: string): boolean {
    if (!cif || cif.length !== 9) return false;

    const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
    if (!cifRegex.test(cif)) return false;

    const letters = 'JABCDEFGHI';
    const number = cif.substring(1, 8);
    const letter = cif.charAt(8);
    const expectedLetter = letters.charAt(this.calculateCIFControl(number));

    return letter === expectedLetter || letter === this.calculateCIFControl(number).toString();
  }

  /**
   * Calcula dígito de control para CIF usando algoritmo oficial
   */
  private calculateCIFControl(number: string): number {
    let sum = 0;
    for (let i = 0; i < number.length; i++) {
      let digit = parseInt(number.charAt(i));
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Genera CIF válido para testing
   */
  generateValidCIF(): string {
    const letters = 'ABCDEFGHJNPQRSUVW';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 9000000) + 1000000; // 7 dígitos

    const control = this.calculateCIFControl(numbers.toString());
    const controlChar = 'JABCDEFGHI'[control];

    return `${letter}${numbers}${controlChar}`;
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

    // Convertir X/Y/Z a números
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
   * Valida identificación según tipo de cliente
   */
  validateIdentification(identification: string, clientType: string): { isValid: boolean; message?: string } {
    if (!identification || identification.trim() === '') {
      return {isValid: false, message: 'La identificación es obligatoria'};
    }
    const cleanId = identification.toUpperCase().trim();

    if (clientType === 'empresa') {
      if (!this.validateCIF(cleanId)) {
        return {isValid: false, message: 'El CIF no tiene un formato válido'};
      }
    } else {
      const isValidNIF = this.validateNIF(cleanId);
      const isValidNIE = this.validateNIE(cleanId);
      const isValidPassport = this.validatePassport(cleanId);

      if (!isValidNIF && !isValidNIE && !isValidPassport) {
        return {
          isValid: false,
          message: 'Debe ser un NIF, NIE o Pasaporte válido'
        };
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
      return {isValid: false, message: 'El formato del email no es válido'};
    }

    return {isValid: true};
  }

  validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone || phone.trim() === '') {
      return {isValid: false, message: 'El teléfono es obligatorio'};
    }

    // Teléfonos españoles: empiezan por 6, 7, 8 o 9
    const phoneRegex = /^[6-9][0-9]{8}$/;
    const cleanPhone = phone.replace(/\s/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      return {isValid: false, message: 'El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9'};
    }

    return {isValid: true};
  }

  validatePostalCode(postalCode: string): { isValid: boolean; message?: string } {
    if (!postalCode || postalCode.trim() === '') {
      return {isValid: false, message: 'El código postal es obligatorio'};
    }

    const postalRegex = /^[0-9]{5}$/;
    if (!postalRegex.test(postalCode)) {
      return {isValid: false, message: 'El código postal debe tener 5 dígitos'};
    }

    return {isValid: true};
  }

  /**
   * Validación completa - orquesta todas las validaciones
   */
  validateClient(client: Clients): { isValid: boolean; message?: string } {
    const cleanClient = this.cleanClientData(client);

    // Ejecutar todas las validaciones en secuencia
    const requiredValidation = this.validateRequiredFields(cleanClient);
    if (!requiredValidation.isValid) return requiredValidation;

    const idValidation = this.validateIdentification(cleanClient.identification, cleanClient.type_client);
    if (!idValidation.isValid) return idValidation;

    const emailValidation = this.validateEmail(cleanClient.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.validatePhone(cleanClient.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.validatePostalCode(cleanClient.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true};
  }
}
