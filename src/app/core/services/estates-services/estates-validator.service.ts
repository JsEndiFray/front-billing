import {Injectable} from '@angular/core';
import {Estates} from '../../../interface/estates.interface';

@Injectable({
  providedIn: 'root'
})
export class EstatesValidatorService {

  constructor() {
  }

  //validar formato de referencia catastral
  isValidRefCatFormat(refCat: string): boolean {
    return /^[0-9A-Z]{20}$/i.test(refCat);
  }

  //Limpiar y transformar datos
  cleanEstatesData(estate: Estates): Estates {
    return {
      id: estate.id,
      cadastral_reference: estate.cadastral_reference?.toUpperCase().trim(),
      address: estate.address?.toUpperCase().trim(),
      location: estate.location?.toUpperCase().trim(),
      province: estate.province?.toUpperCase().trim(),
      country: estate.country?.toUpperCase().trim(),
      postal_code: estate.postal_code?.trim(),
      price: estate.price,
      surface: estate.surface,
    } as Estates;
  }

  // Validar campos requeridos
  validateRequiredFields(estate: Estates): { isValid: boolean; message?: string } {
    if (!estate.cadastral_reference ||
      !estate.price ||
      !estate.address ||
      !estate.postal_code ||
      !estate.location ||
      !estate.province ||
      !estate.country ||
      !estate.surface) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      };
    }
    return {isValid: true};
  }

  // Validar referencia catastral
  validateCadastralReference(refCat: string): { isValid: boolean; message?: string } {
    if (refCat.length !== 20 || !this.isValidRefCatFormat(refCat)) {
      return {
        isValid: false,
        message: 'La referencia catastral debe tener exactamente 20 caracteres y solo puede contener números y letras.'
      };
    }
    return {isValid: true};
  }

  //Validación completa
  validateEstate(estate: Estates): { isValid: boolean; message?: string } {
    const cleanEstate = this.cleanEstatesData(estate);

    // Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(cleanEstate);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }

    // Validar referencia catastral
    const refValidation = this.validateCadastralReference(cleanEstate.cadastral_reference);
    if (!refValidation.isValid) {
      return refValidation;
    }

    return {isValid: true};
  }
}
