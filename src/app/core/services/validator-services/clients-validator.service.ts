import {Injectable} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';

@Injectable({
  providedIn: 'root'
})
export class ClientsValidatorService {

  constructor() {
  }

  //Limpiar y transformar datos
  cleanClientData(client: Clients): Clients {
    return {
      id: client.id,
      type_client: client.type_client?.trim(),
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
      country: client.country?.toUpperCase().trim() || '',
      parent_company_id: client.parent_company_id,
      relationship_type: client.relationship_type
    } as Clients;
  }

  // Validar campos requeridos
  validateRequiredFields(client: Clients): { isValid: boolean; message?: string } {
    //Validación campo por campo
    if (!client.type_client || client.type_client.trim() === '') {
      return {isValid: false, message: 'El tipo de cliente es obligatorio'};
    }

    if (!client.name || client.name.trim() === '') {
      return {isValid: false, message: 'El nombre del administrador es obligatorio'};
    }
    if (!client.lastname || client.lastname.trim() === '') {
      return {isValid: false, message: 'El apellido del administrador es obligatorio'};
    }

    if (!client.identification || client.identification.trim() === '') {
      return {isValid: false, message: 'La identificación es obligatoria'};
    }

    if (!client.email || client.email.trim() === '') {
      return {isValid: false, message: 'El email es obligatorio'};
    }

    if (!client.phone || client.phone.trim() === '') {
      return {isValid: false, message: 'El teléfono es obligatorio'};
    }

    if (!client.address || client.address.trim() === '') {
      return {isValid: false, message: 'La dirección es obligatoria'};
    }

    if (!client.postal_code || client.postal_code.trim() === '') {
      return {isValid: false, message: 'El código postal es obligatorio'};
    }

    if (!client.location || client.location.trim() === '') {
      return {isValid: false, message: 'La localidad es obligatoria'};
    }

    if (!client.province || client.province.trim() === '') {
      return {isValid: false, message: 'La provincia es obligatoria'};
    }

    if (!client.country || client.country.trim() === '') {
      return {isValid: false, message: 'El país es obligatorio'};
    }

    // Validar company_name SOLO para empresas
    if (client.type_client === 'empresa') {
      if (!client.company_name || client.company_name.trim() === '') {
        return {
          isValid: false,
          message: 'El nombre de la empresa es obligatorio'
        };
      }
    }

    return {isValid: true};
  }

//validacion de la indentidicacion.
  validateIdentification(client: Clients): { isValid: boolean; message?: string } {
    const identification = client.identification?.trim().toUpperCase();
    if (!identification) {
      return {
        isValid: false,
        message: 'La identificación es obligatoria'
      };
    }
    // Patrones de validación españoles
    const dniPattern = /^\d{8}[A-Z]$/;           // 12345678A
    const niePattern = /^[XYZ]\d{7}[A-Z]$/;     // X1234567A
    const cifPattern = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;  // A12345678

    switch (client.type_client?.toLowerCase()) {
      case 'particular':
      case 'autonomo':
        if (!dniPattern.test(identification) && !niePattern.test(identification)) {
          return {
            isValid: false,
            message: 'Los particulares/autónomos deben usar DNI (12345678A) o NIE (X1234567A)'
          };
        }
        break;
      case 'empresa':
        if (!cifPattern.test(identification)) {
          return {
            isValid: false,
            message: 'Las empresas deben usar CIF válido (A12345678)'
          };
        }
        break;
      default:
        return {
          isValid: false,
          message: 'Debe seleccionar el tipo de cliente'
        };
    }
    return {isValid: true};
  }

  //validamos el email
  validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        message: 'El email es obligatorio'
      };
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return {
        isValid: false,
        message: 'El formato del email no es válido'
      };
    }
    return {isValid: true};
  }

  //validamos el teléfono
  validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone || phone.trim() === '') {
      return {
        isValid: false,
        message: 'El teléfono es obligatorio'
      };
    }
    // Validar teléfono español (9 dígitos)
    const phonePattern = /^\d{9}$/;
    if (!phonePattern.test(phone)) {
      return {
        isValid: false,
        message: 'El teléfono debe tener exactamente 9 dígitos'
      };
    }
    return {isValid: true};
  }

  //Validación completa
  validateClient(client: Clients): { isValid: boolean; message?: string } {
    // 1. Limpiar datos
    const cleanClient = this.cleanClientData(client)

    // 2. Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(cleanClient);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }
    // 3. Validar identificación
    const identificationValidation = this.validateIdentification(cleanClient);
    if (!identificationValidation.isValid) {
      return identificationValidation;
    }
    // 4. Validar email
    const emailValidation = this.validateEmail(cleanClient.email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    // 5. Validar teléfono
    const phoneValidation = this.validatePhone(cleanClient.phone);
    if (!phoneValidation.isValid) {
      return phoneValidation;
    }
    return {isValid: true};

  }


}
