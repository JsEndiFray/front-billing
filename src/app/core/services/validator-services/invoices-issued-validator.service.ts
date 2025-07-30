import {Injectable} from '@angular/core';
import {Invoice} from '../../../interface/invoices-issued-interface';

@Injectable({
  providedIn: 'root'
})
export class InvoicesIssuedValidatorService {

  constructor() {
  }

  /**
   * Limpia y transforma datos de facturas emitidas (Invoice)
   * @param invoice - La factura a limpiar
   * @returns La factura con datos limpiados y transformados
   */

  cleanInvoiceData(invoice: Invoice): Invoice {
    return {
      id: invoice.id,
      estates_id: invoice.estates_id,
      clients_id: invoice.clients_id,
      owners_id: invoice.owners_id,
      ownership_percent: invoice.ownership_percent,
      invoice_date: invoice.invoice_date,
      tax_base: invoice.tax_base,
      iva: invoice.iva,
      irpf: invoice.irpf,
      total: invoice.total,
      is_refund: invoice.is_refund,
      original_invoice_id: invoice.original_invoice_id,

      // CAMPOS DE COBRO INCLUIDOS (antes pago)
      collection_status: invoice.collection_status || 'pending',
      collection_method: invoice.collection_method || 'transfer',
      collection_date: invoice.collection_date,
      collection_notes: invoice.collection_notes || '',
      collection_reference: invoice.collection_reference || '',

      // CAMPOS PROPORCIONALES INCLUIDOS
      start_date: invoice.start_date,
      end_date: invoice.end_date,
      corresponding_month: invoice.corresponding_month,
      is_proportional: invoice.is_proportional,

      created_at: invoice.created_at,
      updated_at: invoice.updated_at
    } as Invoice;
  }

  /**
   * Valida los campos obligatorios de una factura emitida
   * @param invoice - La factura a validar
   * @returns Un objeto con `isValid` (boolean) y `message` (string, opcional)
   */
  validateRequiredFields(invoice: Invoice): { isValid: boolean; message?: string } {

    if (!invoice.estates_id ||
      !invoice.clients_id ||
      !invoice.owners_id ||
      !invoice.invoice_date || // CAMBIO: date a invoice_date
      invoice.tax_base === null || invoice.tax_base === undefined || // Uso explícito de === null || === undefined
      invoice.iva === null || invoice.iva === undefined ||
      invoice.irpf === null || invoice.irpf === undefined
    ) {
      return {
        isValid: false,
        message: 'Todos los campos marcados con * son obligatorios.'
      }
    }
    // VALIDACIÓN ADICIONAL: Si está marcado como cobrado, debe tener fecha
    if (invoice.collection_status === 'collected' && !invoice.collection_date) {
      return {
        isValid: false,
        message: 'Las facturas marcadas como cobradas deben tener una fecha de cobro.'
      };

    }


    return {isValid: true};
  }

  // ========================================
  // NUEVAS VALIDACIONES NUMÉRICAS Y DE RANGOS
  // ========================================

  /**
   * Valida que los campos numéricos de importes y porcentajes sean válidos y estén dentro de rangos lógicos.
   * @param invoice - La factura a validar
   * @returns Un objeto con `isValid` (boolean) y `message` (string, opcional)
   */
  validateNumericFields(invoice: Invoice): { isValid: boolean; message?: string } {
    const taxBase = invoice.tax_base || 0;
    const iva = invoice.iva || 0;
    const irpf = invoice.irpf || 0;
    const total = invoice.total || 0;
    const ownershipPercent = invoice.ownership_percent || 0;

    // 1. tax_base: debe ser un número y para facturas normales, debe ser positivo.
    // Para abonos (is_refund), la base imponible puede ser negativa.
    if (typeof taxBase !== 'number' || isNaN(taxBase)) {
      return {isValid: false, message: 'La Base Imponible debe ser un número válido.'};
    }
    if (!invoice.is_refund && taxBase < 0) { // Si no es abono, debe ser positivo
      return {isValid: false, message: 'La Base Imponible no puede ser negativa para facturas normales.'};
    }

    // 2. IVA: debe ser un número y un porcentaje válido (0-100).
    if (typeof iva !== 'number' || isNaN(iva) || iva < 0 || iva > 100) {
      return {isValid: false, message: 'El IVA debe ser un porcentaje entre 0 y 100.'};
    }

    // 3. IRPF: debe ser un número y un porcentaje válido (0-100).
    if (typeof irpf !== 'number' || isNaN(irpf) || irpf < 0 || irpf > 100) {
      return {isValid: false, message: 'El IRPF debe ser un porcentaje entre 0 y 100.'};
    }

    // 4. Total: debe ser un número. La validación de su cálculo ya se hace en el util service.
    if (typeof total !== 'number' || isNaN(total)) {
      return {isValid: false, message: 'El Total de la factura debe ser un número válido.'};
    }

    // 5. ownership_percent: debe ser un número y estar entre 0 y 100.
    if (typeof ownershipPercent !== 'number' || isNaN(ownershipPercent) || ownershipPercent < 0 || ownershipPercent > 100) {
      return {isValid: false, message: 'El Porcentaje de Propiedad debe ser un número entre 0 y 100.'};
    }

    return {isValid: true};
  }


  /**
   * Realiza una validación completa de una factura emitida
   * NOTA: Este método es más una orquestación de validaciones.
   * @param invoice - La factura a validar
   * @returns Un objeto con `isValid` (boolean) y `message` (string, opcional)
   */
  validateInvoice(invoice: Invoice): { isValid: boolean; message?: string } {
    const cleanData = this.cleanInvoiceData(invoice);

    // Validar campos obligatorios y fechas de cobro
    const requiredValidation = this.validateRequiredFields(cleanData);
    if (!requiredValidation.isValid) return requiredValidation;

    // Validar que los campos numéricos son correctos y están en rango
    const numericValidation = this.validateNumericFields(cleanData); // AÑADIDO: Llamada a la nueva validación
    if (!numericValidation.isValid) return numericValidation;

    return {isValid: true}
  }


}
