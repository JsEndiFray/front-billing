import {Injectable} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';

// Imports de interfaces
import {Clients} from '../../../interfaces/clientes-interface';
import {Employee} from '../../../interfaces/employee-interface';
import {Owners} from '../../../interfaces/owners-interface';
import {User} from '../../../interfaces/users-interface';
import {Estates} from '../../../interfaces/estates-interface';
import {Invoice} from '../../../interfaces/invoices-issued-interface';
import {EstatesOwners} from '../../../interfaces/estates-owners-interface';

/**
 * Servicio de validación unificado para toda la aplicación
 * Elimina duplicación de código y centraliza todas las validaciones
 * Incluye transformaciones nativas de Angular y validaciones cruzadas automáticas
 */
@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  constructor(
    private fb: FormBuilder
  ) {
  }

  // ===========================
  // TRANSFORMACIONES NATIVAS
  // ===========================

  /**
   * Aplica transformaciones automáticas usando Angular Forms
   * Se puede usar con valueChanges o en el submit en caso  que no transforme demasiado
   */
  applyTransformations(formGroup: FormGroup, entityType: 'client' | 'employee' | 'owner' | 'user' | 'estate' | 'estate_ownership' | 'invoice'): void {
    const controls = formGroup.controls;

    // Transformaciones comunes para personas
    if (['client', 'employee', 'owner'].includes(entityType)) {
      this.transformPersonFields(controls);
    }

    // Transformaciones específicas por tipo
    switch (entityType) {
      case 'user':
        this.transformUserFields(controls);
        break;
      case 'estate':
        this.transformEstateFields(controls);
        break;
      case 'estate_ownership':
        this.transformEstateOwnershipFields(controls);
        break;
      case 'invoice':
        this.transformInvoiceFields(controls);
        break;
    }
  }

  //'client', 'employee', 'owner'
  private transformPersonFields(controls: { [key: string]: AbstractControl }): void {
    // Nombres y apellidos a mayúsculas
    ['name', 'lastname', 'company_name', 'address', 'location', 'province', 'country'].forEach(field => {
      if (controls[field]?.value) {
        controls[field].setValue(controls[field].value.toString().toUpperCase().trim(), {emitEvent: false});
      }
    });

    // Email a minúsculas
    if (controls['email']?.value) {
      controls['email'].setValue(controls['email'].value.toString().toLowerCase().trim(), {emitEvent: false});
    }

    // Identificación a mayúsculas
    if (controls['identification']?.value) {
      controls['identification'].setValue(controls['identification'].value.toString().toUpperCase().trim(), {emitEvent: false});
    }

    // Teléfono: limpiar espacios
    if (controls['phone']?.value) {
      controls['phone'].setValue(controls['phone'].value.toString().replace(/\s/g, ''), {emitEvent: false});
    }

    // Código postal: limpiar espacios
    if (controls['postal_code']?.value) {
      controls['postal_code'].setValue(controls['postal_code'].value.toString().trim(), {emitEvent: false});
    }
  }

  //user
  private transformUserFields(controls: { [key: string]: AbstractControl }): void {
    // Username y email a minúsculas
    ['username', 'email'].forEach(field => {
      if (controls[field]?.value) {
        controls[field].setValue(controls[field].value.toString().toLowerCase().trim(), {emitEvent: false});
      }
    });
  }

  //estate
  private transformEstateFields(controls: { [key: string]: AbstractControl }): void {
    // Referencia catastral a mayúsculas
    if (controls['cadastral_reference']?.value) {
      controls['cadastral_reference'].setValue(
        controls['cadastral_reference'].value.toString().toUpperCase().trim(),
        {emitEvent: false}
      );
    }
    // Dirección y ubicación a mayúsculas
    ['address', 'location', 'province', 'country'].forEach(field => {
      if (controls[field]?.value) {
        controls[field].setValue(controls[field].value.toString().toUpperCase().trim(), {emitEvent: false});
      }
    });

    // Código postal: limpiar espacios
    if (controls['postal_code']?.value) {
      controls['postal_code'].setValue(controls['postal_code'].value.toString().trim(), {emitEvent: false});
    }
  }

  //estate_ownership
  private transformEstateOwnershipFields(controls: { [key: string]: AbstractControl }): void {
    // Asegurar que los porcentajes sean números válidos
    if (controls['ownership_percentage']?.value) {
      const percentage = parseFloat(controls['ownership_percentage'].value);
      if (!isNaN(percentage)) {
        // Redondear a 2 decimales máximo
        controls['ownership_percentage'].setValue(
          Math.round(percentage * 100) / 100,
          {emitEvent: false}
        );
      }
    }
    // Si hay observaciones, limpiar espacios
    if (controls['notes']?.value) {
      controls['notes'].setValue(controls['notes'].value.toString().trim(), {emitEvent: false});
    }
  }

  //Invoice
  private transformInvoiceFields(controls: { [key: string]: AbstractControl }): void {
    // Asignar valores por defecto si están vacíos
    if (!controls['collection_status']?.value) {
      controls['collection_status']?.setValue('pending', {emitEvent: false});
    }
    if (!controls['collection_method']?.value) {
      controls['collection_method']?.setValue('transfer', {emitEvent: false});
    }

    // Limpiar strings existentes
    ['collection_notes', 'collection_reference'].forEach(field => {
      if (controls[field]?.value) {
        controls[field].setValue(controls[field].value.toString().trim(), {emitEvent: false});
      } else {
        controls[field]?.setValue('', {emitEvent: false});
      }
    });
  }

  // ========================================
  // VALIDACIONES DE DOCUMENTOS ESPAÑOLES
  // ========================================

  /**
   * Valida NIF con algoritmo oficial de letra de control
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

    // Convertir X/Y/Z a números según algoritmo oficial
    if (nie.charAt(0) === 'Y') number = '1' + number;
    else if (nie.charAt(0) === 'Z') number = '2' + number;
    else number = '0' + number;

    const letter = nie.charAt(8);
    return letter === letters.charAt(parseInt(number) % 23);
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
   * Valida formato de pasaporte básico
   */
  private validatePassport(passport: string): boolean {
    if (!passport || passport.length < 6 || passport.length > 9) return false;
    const passportRegex = /^[A-Z0-9]{6,9}$/;
    return passportRegex.test(passport.toUpperCase());
  }

  /**
   * Valida formato de referencia catastral española (20 caracteres alfanuméricos)
   */
  private validateCadastralReferenceFormat(refCat: string): boolean {
    if (!refCat || refCat.length !== 20) return false;
    return /^[0-9A-Z]{20}$/i.test(refCat);
  }


  /**
   * Valida existencia real de referencia catastral consultando nuestro backend
   */
  async validateCadastralReferenceExists(refCat: string): Promise<{ isValid: boolean; message?: string }> {
    // 1. Validar formato localmente primero
    if (!this.validateCadastralReferenceFormat(refCat)) {
      return {
        isValid: false,
        message: 'La referencia catastral debe tener exactamente 20 caracteres alfanuméricos'
      };
    }

    // 2. Consultar nuestro backend (que consulta el Catastro)
    try {
      const cleanRef = refCat.trim().toUpperCase();
      const response = await fetch(`/api/cadastral/validate/${cleanRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Ajusta según tu auth
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error validando referencia catastral:', error);
      return {
        isValid: true,
        message: 'Formato válido. No se pudo verificar existencia (problema de conexión)'
      };
    }
  }

  // ========================================
  // VALIDACIONES CRUZADAS AUTOMÁTICAS
  // ========================================

  /**
   * Validación automática de identificación según tipo de cliente
   */
  validateIdentification(identification: string, clientType?: string): { isValid: boolean; message?: string } {
    if (!identification || identification.trim() === '') {
      return {isValid: false, message: 'La identificación es obligatoria'};
    }

    const cleanId = identification.toUpperCase().trim();

    // Validación cruzada automática para clientes
    if (clientType === 'empresa') {
      if (!this.validateCIF(cleanId)) {
        return {isValid: false, message: 'El CIF no tiene un formato válido'};
      }
    } else {
      // Para personas: NIF, NIE o Pasaporte (empleados, propietarios, clientes persona)
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

  // ========================================
  // VALIDACIONES BÁSICAS UNIFICADAS
  // ========================================

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

  validatePercentage(percentage: number | string | null | undefined, fieldName: string = 'porcentaje'): {
    isValid: boolean;
    message?: string
  } {
    if (!percentage && percentage !== 0) {
      return {isValid: false, message: `El ${fieldName} es obligatorio`};
    }

    const percentageValue = Number(percentage);

    if (isNaN(percentageValue)) {
      return {isValid: false, message: `El ${fieldName} debe ser un número válido`};
    }

    if (percentageValue <= 0) {
      return {isValid: false, message: `El ${fieldName} debe ser mayor a 0`};
    }

    if (percentageValue > 100) {
      return {isValid: false, message: `El ${fieldName} no puede exceder 100%`};
    }

    return {isValid: true};
  }

  // ========================================
  // CÁLCULOS ESPECÍFICOS DE ESPAÑA
  // ========================================

  /**
   * Calcula el total de una factura con IVA e IRPF españoles
   */
  calculateInvoiceTotal(taxBase: number, ivaPercent: number, irpfPercent: number): number {
    const iva = (taxBase * ivaPercent) / 100;
    const irpf = (taxBase * irpfPercent) / 100;
    return taxBase + iva - irpf;
  }

  /**
   * Valida campos numéricos de factura
   */
  validateInvoiceNumericFields(invoice: Invoice): { isValid: boolean; message?: string } {
    const taxBase = invoice.tax_base || 0;
    const iva = invoice.iva || 0;
    const irpf = invoice.irpf || 0;
    const total = invoice.total || 0;
    const ownershipPercent = invoice.ownership_percent || 0;

    // Validar base imponible
    if (typeof taxBase !== 'number' || isNaN(taxBase)) {
      return {isValid: false, message: 'La Base Imponible debe ser un número válido.'};
    }
    if (!invoice.is_refund && taxBase < 0) {
      return {isValid: false, message: 'La Base Imponible no puede ser negativa para facturas normales.'};
    }

    // Validar IVA
    if (typeof iva !== 'number' || isNaN(iva) || iva < 0 || iva > 100) {
      return {isValid: false, message: 'El IVA debe ser un porcentaje entre 0 y 100.'};
    }

    // Validar IRPF
    if (typeof irpf !== 'number' || isNaN(irpf) || irpf < 0 || irpf > 100) {
      return {isValid: false, message: 'El IRPF debe ser un porcentaje entre 0 y 100.'};
    }

    // Validar total
    if (typeof total !== 'number' || isNaN(total)) {
      return {isValid: false, message: 'El Total de la factura debe ser un número válido.'};
    }

    // Validar porcentaje de propiedad
    if (typeof ownershipPercent !== 'number' || isNaN(ownershipPercent) || ownershipPercent < 0 || ownershipPercent > 100) {
      return {isValid: false, message: 'El Porcentaje de Propiedad debe ser un número entre 0 y 100.'};
    }

    // Validar que el total calculado coincida (con margen de error por decimales)
    const calculatedTotal = this.calculateInvoiceTotal(taxBase, iva, irpf);
    if (Math.abs(total - calculatedTotal) > 0.01) {
      return {isValid: false, message: 'El total no coincide con el cálculo de Base + IVA - IRPF.'};
    }

    return {isValid: true};
  }

  // ========================================
  // VALIDACIONES COMPLETAS POR ENTIDAD
  // ========================================

  /**
   * Validación completa para clientes
   */
  validateClient(client: Clients): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!client.name || !client.lastname || !client.identification ||
      !client.phone || !client.email || !client.address ||
      !client.postal_code || !client.location || !client.province || !client.country) {
      return {isValid: false, message: 'Todos los campos son obligatorios'};
    }

    // Validaciones específicas
    const idValidation = this.validateIdentification(client.identification, client.type_client);
    if (!idValidation.isValid) return idValidation;

    const emailValidation = this.validateEmail(client.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.validatePhone(client.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.validatePostalCode(client.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true};
  }

  /**
   * Validación completa para empleados
   */
  validateEmployee(employee: Employee): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!employee.name || !employee.lastname || !employee.email ||
      !employee.identification || !employee.phone || !employee.address ||
      !employee.postal_code || !employee.location || !employee.province || !employee.country) {
      return {isValid: false, message: 'Todos los campos son obligatorios.'};
    }

    // Empleados son siempre personas (no empresas)
    const idValidation = this.validateIdentification(employee.identification);
    if (!idValidation.isValid) return idValidation;

    const emailValidation = this.validateEmail(employee.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.validatePhone(employee.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.validatePostalCode(employee.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true};
  }

  /**
   * Validación completa para propietarios
   */
  validateOwner(owner: Owners): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!owner.name || !owner.lastname || !owner.email ||
      !owner.identification || !owner.phone || !owner.address ||
      !owner.postal_code || !owner.location || !owner.province || !owner.country) {
      return {isValid: false, message: 'Todos los campos son obligatorios.'};
    }

    // Propietarios son siempre personas (no empresas)
    const idValidation = this.validateIdentification(owner.identification);
    if (!idValidation.isValid) return idValidation;

    const emailValidation = this.validateEmail(owner.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.validatePhone(owner.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.validatePostalCode(owner.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return {isValid: true};
  }

  /**
   * Validación completa para usuarios
   */
  validateUser(user: User): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!user.username || !user.password || !user.email || !user.phone) {
      return {isValid: false, message: 'Todos los campos son obligatorios.'};
    }

    // Validar coincidencia de contraseñas si existe confirmación
    if (user.confirm_password !== undefined && user.password !== user.confirm_password) {
      return {isValid: false, message: 'Las contraseñas no coinciden'};
    }

    // Validar rol
    if (!user.role || user.role === '') {
      return {isValid: false, message: 'Debe seleccionar un rol'};
    }

    return {isValid: true};
  }

  /**
   * Validación completa para propiedades (AHORA CON VALIDACIÓN REAL)
   */
  async validateEstate(estate: Estates): Promise<{ isValid: boolean; message?: string }> {
    // Campos obligatorios
    if (!estate.cadastral_reference || estate.price === null || estate.price === undefined ||
      !estate.address || !estate.postal_code || !estate.location || !estate.province ||
      !estate.country || estate.surface === null || estate.surface === undefined) {
      return {isValid: false, message: 'Todos los campos son obligatorios.'};
    }

    // Validar código postal
    const postalValidation = this.validatePostalCode(estate.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    // Validar campos numéricos
    if (estate.price <= 0) {
      return {isValid: false, message: 'El precio debe ser mayor a 0'};
    }

    if (estate.surface <= 0) {
      return {isValid: false, message: 'La superficie debe ser mayor a 0'};
    }

    // Validar formato de referencia catastral
    if (!this.validateCadastralReferenceFormat(estate.cadastral_reference)) {
      return {isValid: false, message: 'La referencia catastral debe tener exactamente 20 caracteres alfanuméricos'};
    }
    //Validación asíncrona de existencia real (solo si formato es correcto)
    try {
      const cadastralValidation = await this.validateCadastralReferenceExists(estate.cadastral_reference);
      return cadastralValidation;
    } catch (error) {
      // Si hay error de conexión, permitir continuar con advertencia
      console.warn('Error validando referencia catastral:', error);
      return {
        isValid: true,
        message: 'Formato válido. No se pudo verificar existencia (problema de conexión)'
      };
    }
  }

  /**
   * Validación completa para facturas emitidas
   */
  validateInvoice(invoice: Invoice): { isValid: boolean; message?: string } {

    // Campos obligatorios
    if (!invoice.estates_id || !invoice.clients_id || !invoice.owners_id ||
      !invoice.invoice_date || invoice.tax_base === null || invoice.tax_base === undefined ||
      invoice.iva === null || invoice.iva === undefined ||
      invoice.irpf === null || invoice.irpf === undefined) {
      return {isValid: false, message: 'Todos los campos marcados con * son obligatorios.'};
    }


    // Validaciones para facturas cobradas
    if (invoice.collection_status === 'collected') {
      if (!invoice.collection_date) {
        return {isValid: false, message: 'Las facturas marcadas como cobradas deben tener una fecha de cobro.'};
      }
      //validación de referencia
      if (!invoice.collection_reference || invoice.collection_reference.trim() === '') {
        return {isValid: false, message: 'Las facturas cobradas deben tener referencia de pago.'};
      }
      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(invoice.collection_date)) {
        return {isValid: false, message: 'Formato de fecha inválido.'};
      }

    }


    // Validar campos numéricos y cálculos
    const numericValidation = this.validateInvoiceNumericFields(invoice);
    if (!numericValidation.isValid) return numericValidation;

    return {isValid: true};
  }


  /**
   * Validación completa para relaciones propiedad-propietario
   */
  validateEstateOwner(ownerEstate: EstatesOwners): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!ownerEstate.estate_id) {
      return {isValid: false, message: 'Selecciona una propiedad'};
    }

    if (!ownerEstate.owners_id) {
      return {isValid: false, message: 'Selecciona un propietario'};
    }

    if (!ownerEstate.ownership_percentage) {
      return {isValid: false, message: 'El porcentaje de propiedad es obligatorio'};
    }

    // Validar porcentaje
    const percentageValidation = this.validatePercentage(ownerEstate.ownership_percentage, 'porcentaje de propiedad');
    if (!percentageValidation.isValid) return percentageValidation;

    return {isValid: true};
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

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
   * Transforma rol de español a inglés para backend
   */
  transformRoleToBackend(role: string): string {
    if (role === 'empleado') return 'employee';
    if (role === 'administrador') return 'admin';
    return role;
  }

  // ==========================================
  // MÉTODOS DE GESTIÓN DEL FORMARRAY
  // ==========================================

  /**
   * Crea un FormGroup para editar cobros de una factura específica
   */
  createCollectionFormGroup(invoice: Invoice): FormGroup {
    return this.fb.group({
      invoiceId: [invoice.id, [Validators.required]],
      collection_status: [invoice.collection_status || 'pending'],
      collection_method: [invoice.collection_method || 'transfer'],
      collection_date: [invoice.collection_date || ''],
      collection_notes: [invoice.collection_notes || ''],
      collection_reference: [invoice.collection_reference || '']
    });
  }

  // ========================================
  // VALIDADORES PARA FILTROS
  // ========================================

  // Validadores cruzados tipados correctamente
  dateRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    const validation = this.validateDateRange(startDate, endDate);
    return validation.isValid ? null : {dateRange: {message: validation.message}};
  };

  amountRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const minAmount = control.get('minAmount')?.value;
    const maxAmount = control.get('maxAmount')?.value;

    const validation = this.validateNumericRange(minAmount, maxAmount, 'monto');
    return validation.isValid ? null : {amountRange: {message: validation.message}};
  };


  /**
   * Valida rango de fechas para filtros
   */
  private validateDateRange(startDate: string | null, endDate: string | null): { isValid: boolean; message?: string } {
    if (!startDate && !endDate) {
      return {isValid: true}; // Ambas vacías es válido
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return {isValid: false, message: 'La fecha inicial no puede ser posterior a la fecha final'};
      }
    }

    return {isValid: true};
  }

  /**
   * Valida rango numérico para filtros (montos, etc.)
   */
  private validateNumericRange(minValue: number | null, maxValue: number | null, fieldName: string = 'valor'): {
    isValid: boolean;
    message?: string
  } {
    if (minValue === null && maxValue === null) {
      return {isValid: true}; // Ambos vacíos es válido
    }

    if (minValue !== null && minValue < 0) {
      return {isValid: false, message: `El ${fieldName} mínimo no puede ser negativo`};
    }

    if (maxValue !== null && maxValue < 0) {
      return {isValid: false, message: `El ${fieldName} máximo no puede ser negativo`};
    }

    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      return {isValid: false, message: `El ${fieldName} mínimo no puede ser mayor al máximo`};
    }

    return {isValid: true};
  }


}
