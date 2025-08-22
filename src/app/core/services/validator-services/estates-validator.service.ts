import {Injectable} from '@angular/core';
import {Estates} from '../../../interfaces/estates-interface';

/**
 * Servicio de validación para propiedades inmobiliarias
 * Incluye sanitización y validación de referencia catastral española
 */
@Injectable({
  providedIn: 'root'
})
export class EstatesValidatorService {

  constructor() {}

  /**
   * Valida formato de referencia catastral española (20 caracteres alfanuméricos)
   */
  isValidRefCatFormat(refCat: string): boolean {
    return /^[0-9A-Z]{20}$/i.test(refCat);
  }

  /**
   * Limpia y transforma datos de propiedad
   */
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

  /**
   * Valida campos obligatorios
   */
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

  /**
   * Valida referencia catastral española
   */
  validateCadastralReference(refCat: string): { isValid: boolean; message?: string } {
    if (refCat.length !== 20 || !this.isValidRefCatFormat(refCat)) {
      return {
        isValid: false,
        message: 'La referencia catastral debe tener exactamente 20 caracteres y solo puede contener números y letras.'
      };
    }
    return {isValid: true};
  }

  /**
   * Validación completa - orquesta todas las validaciones
   */
  validateEstate(estate: Estates): { isValid: boolean; message?: string } {
    const cleanEstate = this.cleanEstatesData(estate);

    // Ejecutar validaciones en secuencia
    const requiredValidation = this.validateRequiredFields(cleanEstate);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }

    const refValidation = this.validateCadastralReference(cleanEstate.cadastral_reference);
    if (!refValidation.isValid) {
      return refValidation;
    }

    return {isValid: true};
  }
}
