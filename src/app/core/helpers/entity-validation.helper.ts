import { Injectable } from '@angular/core';
import { DataTransformHelper } from './data-transform.helper';
import { DocumentValidationHelper } from './document-validation.helper';
import { FormValidationHelper } from './form-validation.helper';

// Imports de interfaces
import { Clients } from '../../interfaces/clientes-interface';
import { Employee } from '../../interfaces/employee-interface';
import { Owners } from '../../interfaces/owners-interface';
import { User } from '../../interfaces/users-interface';
import { Estates } from '../../interfaces/estates-interface';
import { Invoice } from '../../interfaces/invoices-issued-interface';
import { EstatesOwners } from '../../interfaces/estates-owners-interface';
import { InternalExpense } from '../../interfaces/expenses-interface';

/**
 * Servicio de validación de entidades
 * Centraliza validaciones complejas y cruzadas por tipo de entidad
 *
 * INCLUYE:
 * - Validaciones completas por entidad
 * - Validaciones cruzadas
 * - Lógica de negocio específica
 * - Orquesta los otros servicios de validación
 */
@Injectable({
  providedIn: 'root'
})
export class EntityValidationHelper {

  constructor(
    private dataTransform: DataTransformHelper,
    private documentValidation: DocumentValidationHelper,
    private formValidation: FormValidationHelper
  ) { }

  // ==========================================================
  // VALIDACIÓN DE CLIENTES
  // ==========================================================

  /**
   * Validación completa para clientes
   * Valida: Datos personales, identificación, contacto, dirección
   */
  validateClient(client: Clients): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!client.name || !client.lastname || !client.identification ||
      !client.phone || !client.email || !client.address ||
      !client.postal_code || !client.location || !client.province || !client.country) {
      return { isValid: false, message: 'Todos los campos son obligatorios' };
    }

    // Validar identificación según tipo de cliente
    const entityType = client.type_client === 'empresa' ? 'company' : 'person';
    const idValidation = this.documentValidation.validateIdentification(
      client.identification,
      entityType
    );
    if (!idValidation.isValid) return idValidation;

    // Validar email
    const emailValidation = this.formValidation.validateEmail(client.email);
    if (!emailValidation.isValid) return emailValidation;

    // Validar teléfono
    const phoneValidation = this.formValidation.validatePhone(client.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    // Validar código postal
    const postalValidation = this.formValidation.validatePostalCode(client.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE EMPLEADOS
  // ==========================================================

  /**
   * Validación completa para empleados
   * Los empleados son siempre personas (no empresas)
   */
  validateEmployee(employee: Employee): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!employee.name || !employee.lastname || !employee.email ||
      !employee.identification || !employee.phone || !employee.address ||
      !employee.postal_code || !employee.location || !employee.province || !employee.country) {
      return { isValid: false, message: 'Todos los campos son obligatorios.' };
    }

    // Los empleados siempre son personas
    const idValidation = this.documentValidation.validateIdentification(
      employee.identification,
      'person'
    );
    if (!idValidation.isValid) return idValidation;

    // Validaciones básicas
    const emailValidation = this.formValidation.validateEmail(employee.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.formValidation.validatePhone(employee.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.formValidation.validatePostalCode(employee.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE PROPIETARIOS
  // ==========================================================

  /**
   * Validación completa para propietarios
   * Los propietarios son siempre personas (no empresas)
   */
  validateOwner(owner: Owners): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!owner.name || !owner.lastname || !owner.email ||
      !owner.identification || !owner.phone || !owner.address ||
      !owner.postal_code || !owner.location || !owner.province || !owner.country) {
      return { isValid: false, message: 'Todos los campos son obligatorios.' };
    }

    // Los propietarios siempre son personas
    const idValidation = this.documentValidation.validateIdentification(
      owner.identification,
      'person'
    );
    if (!idValidation.isValid) return idValidation;

    // Validaciones básicas
    const emailValidation = this.formValidation.validateEmail(owner.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.formValidation.validatePhone(owner.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    const postalValidation = this.formValidation.validatePostalCode(owner.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE USUARIOS
  // ==========================================================

  /**
   * Validación completa para usuarios del sistema
   */
  validateUser(user: User): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!user.username || !user.password || !user.email || !user.phone) {
      return { isValid: false, message: 'Todos los campos son obligatorios.' };
    }

    // Validar coincidencia de contraseñas si existe confirmación
    if (user.confirm_password !== undefined && user.password !== user.confirm_password) {
      return { isValid: false, message: 'Las contraseñas no coinciden' };
    }

    // Validar rol
    if (!user.role || user.role === '') {
      return { isValid: false, message: 'Debe seleccionar un rol' };
    }

    // Validaciones básicas
    const emailValidation = this.formValidation.validateEmail(user.email);
    if (!emailValidation.isValid) return emailValidation;

    const phoneValidation = this.formValidation.validatePhone(user.phone);
    if (!phoneValidation.isValid) return phoneValidation;

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE PROPIEDADES
  // ==========================================================

  /**
   * Validación completa para propiedades (Estates)
   * Incluye validación remota de referencia catastral si se requiere
   */
  async validateEstate(estate: Estates, validateCadastral: boolean = false):
    Promise<{ isValid: boolean; message?: string }> {

    // Campos obligatorios
    if (!estate.cadastral_reference || estate.price === null || estate.price === undefined ||
      !estate.address || !estate.postal_code || !estate.location || !estate.province ||
      !estate.country || estate.surface === null || estate.surface === undefined) {
      return { isValid: false, message: 'Todos los campos son obligatorios.' };
    }

    // Validar código postal
    const postalValidation = this.formValidation.validatePostalCode(estate.postal_code);
    if (!postalValidation.isValid) return postalValidation;

    // Validar campos numéricos
    if (estate.price <= 0) {
      return { isValid: false, message: 'El precio debe ser mayor a 0' };
    }

    if (estate.surface <= 0) {
      return { isValid: false, message: 'La superficie debe ser mayor a 0' };
    }

    // Validar formato de referencia catastral
    if (!this.documentValidation.validateCadastralReferenceFormat(estate.cadastral_reference)) {
      return { isValid: false, message: 'La referencia catastral debe tener exactamente 20 caracteres alfanuméricos' };
    }

    // Validación remota de referencia catastral si se solicita
    if (validateCadastral) {
      try {
        const cadastralValidation = await this.documentValidation.validateCadastralReferenceExists(
          estate.cadastral_reference
        );
        return cadastralValidation;
      } catch (error) {
        console.warn('Error validando referencia catastral:', error);
        return {
          isValid: true,
          message: 'Formato válido. No se pudo verificar existencia (problema de conexión)'
        };
      }
    }

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE FACTURAS
  // ==========================================================

  /**
   * Validación de campos numéricos de factura
   * Incluye validación de cálculos
   */
  validateInvoiceNumericFields(
    taxBase: unknown,
    iva: unknown,
    irpf: unknown,
    total: unknown,
    isRefund: boolean | number = false
  ): { isValid: boolean; message?: string } {
    const base = this.dataTransform.parseNumber(taxBase);
    const ivaPercent = this.dataTransform.parseNumber(iva);
    const irpfPercent = this.dataTransform.parseNumber(irpf);
    const totalAmount = this.dataTransform.parseNumber(total);

    // Convertir a boolean si es number (0 o 1)
    const isRefundBoolean = typeof isRefund === 'number' ? isRefund === 1 : isRefund;

    // Validar base imponible
    if (isNaN(base)) {
      return { isValid: false, message: 'La Base Imponible debe ser un número válido.' };
    }
    if (!isRefund && base < 0) {
      return { isValid: false, message: 'La Base Imponible no puede ser negativa para facturas normales.' };
    }

    // Validar IVA
    const ivaValidation = this.formValidation.validatePercentage(ivaPercent, 'IVA');
    if (!ivaValidation.isValid) return ivaValidation;

    // Validar IRPF
    const irpfValidation = this.formValidation.validatePercentage(irpfPercent, 'IRPF');
    if (!irpfValidation.isValid) return irpfValidation;

    // Validar total
    if (isNaN(totalAmount)) {
      return { isValid: false, message: 'El Total de la factura debe ser un número válido.' };
    }

    // Validar que el total calculado coincida (con margen de error por decimales)
    const calculatedTotal = base + (base * ivaPercent / 100) - (base * irpfPercent / 100);
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      return { isValid: false, message: 'El total no coincide con el cálculo de Base + IVA - IRPF.' };
    }

    return { isValid: true };
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
      return { isValid: false, message: 'Todos los campos marcados con * son obligatorios.' };
    }

    // Validar campos numéricos
    const numericValidation = this.validateInvoiceNumericFields(
      invoice.tax_base,
      invoice.iva,
      invoice.irpf,
      invoice.total,
      invoice.is_refund || 0
    );
    if (!numericValidation.isValid) return numericValidation;

    // Validaciones para facturas cobradas
    if (invoice.collection_status === 'collected') {
      if (!invoice.collection_date) {
        return { isValid: false, message: 'Las facturas marcadas como cobradas deben tener una fecha de cobro.' };
      }

      if (!invoice.collection_reference || invoice.collection_reference.trim() === '') {
        return { isValid: false, message: 'Las facturas cobradas deben tener referencia de pago.' };
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(invoice.collection_date)) {
        return { isValid: false, message: 'Formato de fecha inválido.' };
      }
    }

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE GASTOS
  // ==========================================================

  /**
   * Validación completa para gastos internos
   */
  validateExpense(expense: InternalExpense): { isValid: boolean; message?: string } {
    // Campos obligatorios básicos
    if (!expense.expense_date || !expense.category || !expense.description ||
      !expense.supplier_name || expense.amount === null || expense.amount === undefined) {
      return { isValid: false, message: 'Todos los campos obligatorios deben estar completos' };
    }

    // Validar cantidad
    const amountValidation = this.formValidation.validateNumberRange(
      expense.amount,
      0.01,
      999999,
      'importe'
    );
    if (!amountValidation.isValid) return amountValidation;

    // Validar IVA
    const ivaValidation = this.formValidation.validatePercentage(expense.iva_percentage, 'IVA');
    if (!ivaValidation.isValid) return ivaValidation;

    // Validar NIF del proveedor si existe
    if (expense.supplier_nif && expense.supplier_nif.trim() !== '') {
      const nifValidation = this.documentValidation.validateIdentification(
        expense.supplier_nif,
        'company'
      );
      if (!nifValidation.isValid) {
        return { isValid: false, message: `NIF del proveedor inválido: ${nifValidation.message}` };
      }
    }

    // Validar fecha de recibo no posterior a fecha de gasto
    if (expense.receipt_date && expense.expense_date) {
      const receiptDate = new Date(expense.receipt_date);
      const expenseDate = new Date(expense.expense_date);

      if (receiptDate > expenseDate) {
        return { isValid: false, message: 'La fecha del recibo no puede ser posterior a la fecha del gasto' };
      }
    }

    // Validar recurrencia
    if (expense.is_recurring) {
      if (!expense.recurrence_period || !expense.next_occurrence_date) {
        return { isValid: false, message: 'Los gastos recurrentes deben tener periodo y próxima fecha' };
      }

      const nextDate = new Date(expense.next_occurrence_date);
      const expenseDate = new Date(expense.expense_date);

      if (nextDate <= expenseDate) {
        return { isValid: false, message: 'La próxima fecha de recurrencia debe ser posterior a la fecha del gasto' };
      }
    }

    return { isValid: true };
  }

  // ==========================================================
  // VALIDACIÓN DE RELACIONES PROPIEDAD-PROPIETARIO
  // ==========================================================

  /**
   * Validación completa para relaciones propiedad-propietario
   */
  validateEstateOwner(ownerEstate: EstatesOwners): { isValid: boolean; message?: string } {
    // Campos obligatorios
    if (!ownerEstate.estate_id) {
      return { isValid: false, message: 'Selecciona una propiedad' };
    }

    if (!ownerEstate.owners_id) {
      return { isValid: false, message: 'Selecciona un propietario' };
    }

    if (!ownerEstate.ownership_percentage) {
      return { isValid: false, message: 'El porcentaje de propiedad es obligatorio' };
    }

    // Validar porcentaje
    const percentageValidation = this.formValidation.validatePercentage(
      ownerEstate.ownership_percentage,
      'porcentaje de propiedad'
    );
    if (!percentageValidation.isValid) return percentageValidation;

    return { isValid: true };
  }

}
