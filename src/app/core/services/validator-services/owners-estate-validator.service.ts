import {Injectable} from '@angular/core';
import {EstatesOwners} from '../../../interfaces/estates-owners-interface';

/**
 * Servicio de validación para relaciones propiedad-propietario
 * Valida porcentajes de propiedad y campos requeridos
 */
@Injectable({
  providedIn: 'root'
})
export class OwnersEstateValidatorService {

  constructor() {
  }

  /**
   * Limpia datos manteniendo solo campos necesarios
   */
  cleanData(ownerEstate: EstatesOwners) {
    return {
      id: ownerEstate.id,
      estate_id: ownerEstate.estate_id,
      owners_id: ownerEstate.owners_id,
      ownership_percentage: ownerEstate.ownership_percentage
    } as EstatesOwners;
  }

  /**
   * Valida campos obligatorios
   */
  validateRequiredFields(ownerEstate: EstatesOwners): { isValid: boolean; message?: string } {
    if (!ownerEstate.estate_id) {
      return {
        isValid: false,
        message: 'Selecciona una propiedad'
      };
    }

    if (!ownerEstate.owners_id) {
      return {
        isValid: false,
        message: 'Selecciona un propietario'
      };
    }

    if (!ownerEstate.ownership_percentage) {
      return {
        isValid: false,
        message: 'El porcentaje de propiedad es obligatorio'
      };
    }

    return {isValid: true};
  }

  /**
   * Valida porcentaje de propiedad (rango 0-100)
   */
  validatePercentage(percentage: number | string | null | undefined): { isValid: boolean; message?: string } {
    if (!percentage && percentage !== 0) {
      return {
        isValid: false,
        message: 'El porcentaje de propiedad es obligatorio'
      };
    }

    const percentageValue = Number(percentage);

    if (isNaN(percentageValue)) {
      return {
        isValid: false,
        message: 'El porcentaje debe ser un número válido'
      };
    }

    if (percentageValue <= 0) {
      return {
        isValid: false,
        message: 'El porcentaje debe ser mayor a 0'
      };
    }

    if (percentageValue > 100) {
      return {
        isValid: false,
        message: 'El porcentaje no puede exceder 100%'
      };
    }

    return {isValid: true};
  }

  /**
   * Validación completa - orquesta todas las validaciones
   */
  validateEstateOwners(ownerEstate: EstatesOwners): { isValid: boolean; message?: string } {
    const cleanData = this.cleanData(ownerEstate);

    // Ejecutar validaciones en secuencia
    const requiredValidation = this.validateRequiredFields(cleanData);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }

    const percentageValidation = this.validatePercentage(cleanData.ownership_percentage);
    if (!percentageValidation.isValid) {
      return percentageValidation;
    }

    return {isValid: true};
  }
}
