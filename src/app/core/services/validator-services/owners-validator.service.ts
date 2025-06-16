import {Injectable} from '@angular/core';
import {Owners} from '../../../interface/owners-interface';

@Injectable({
  providedIn: 'root'
})
export class OwnersValidatorService {

  constructor() {
  }

  //Limpiar y transformar datos
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

  // Validar NIF
  private validateNIF(nif: string): boolean {
    if (!nif || nif.length !== 9) return false;

    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nifRegex.test(nif)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(nif.substring(0, 8));
    const letter = nif.charAt(8);

    return letter === letters.charAt(number % 23);
  }

  // Validar NIE
  private validateNIE(nie: string): boolean {
    if (!nie || nie.length !== 9) return false;

    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nieRegex.test(nie)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let number = nie.substring(1, 8);

    if (nie.charAt(0) === 'Y') number = '1' + number;
    else if (nie.charAt(0) === 'Z') number = '2' + number;
    else number = '0' + number;

    const letter = nie.charAt(8);
    return letter === letters.charAt(parseInt(number) % 23);
  }

  // Validar pasaporte
  private validatePassport(passport: string): boolean {
    if (!passport || passport.length < 6 || passport.length > 9) return false;

    const passportRegex = /^[A-Z0-9]{6,9}$/;
    return passportRegex.test(passport.toUpperCase());
  }

  // Validar identificación según tipo de cliente
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
  };

  //validar email
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

  // Validar teléfono
  validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone || phone.trim() === '') {
      return {isValid: false, message: 'El teléfono es obligatorio'};
    }
    const phoneRegex = /^[6-9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return {isValid: false, message: 'El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9'};
    }
    return {isValid: true}
  }

  //validar codigo postal
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

  //validacion completa
  validateOwners(owners: Owners): { isValid: boolean; message?: string } {
    const cleanOwner = this.cleanOwnerData(owners);

    // Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(cleanOwner);
    if (!requiredValidation.isValid) {
      return requiredValidation
    }


    //validamos la identificacion
    const idValidate = this.validateIdentification(cleanOwner.identification)
    if (!idValidate.isValid) {
      return idValidate;
    }
    //validamos el email
    const emailValidate = this.validateEmail(cleanOwner.email);
    if (!emailValidate.isValid) {
      return emailValidate;
    }
    //dvalidamos el telefono
    const phoneValidate = this.validatePhone(cleanOwner.phone);
    if (!phoneValidate.isValid) {
      return phoneValidate;
    }
    //validamos el codigo postal
    const postalValidation = this.validatePostalCode(cleanOwner.postal_code);
    if (!postalValidation.isValid) {
      return postalValidation;
    }


    return {isValid: true};
  }


}
