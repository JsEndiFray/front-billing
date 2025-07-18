import {Injectable} from '@angular/core';
import {Bill} from '../../../interface/bills-interface';

@Injectable({
  providedIn: 'root'
})
export class BillsUtilService {

  constructor() {
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * Útil para campos de pago automático
   *
   * @returns Fecha actual en formato "2025-07-11"
   */
  getCurrentDateForInput(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Convierte cualquier fecha a formato YYYY-MM-DD para inputs HTML
   * Los inputs type="date" solo aceptan formato "YYYY-MM-DD"
   *
   * @param dateString - Fecha en formato ISO ("2025-07-11T10:30:00Z")
   * @returns Fecha en formato "2025-07-11" o null si no hay fecha
   */
  formatDateForInput(dateString: string | null | undefined): string | undefined {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  /**
   * ACTUALIZADA: Ahora usa getCurrentDateForInput()
   * Maneja el cambio de estado de pago de una factura
   * Si se marca como "pagado" sin fecha, pone la fecha actual
   * Si se marca como "pendiente", limpia la fecha de pago
   *
   * @param bill - La factura a modificar
   */
  handlePaymentStatusChange(bill: Bill): void {
    if (bill.payment_status === 'paid') {
      // Si marca como pagado y no tiene fecha, poner fecha de hoy
      if (!bill.payment_date) {
        bill.payment_date = this.getCurrentDateForInput();
      }
    } else {
      // Si marca como pendiente, limpiar fecha de pago
      bill.payment_date = undefined;
    }
  }

  /**
   * ACTUALIZADA: Ahora usa getCurrentDateForInput()
   * Inicializa valores por defecto para los campos de pago
   * Útil para facturas nuevas
   *
   * @param bill - La factura a inicializar
   */
  initializePaymentDefaults(bill: Bill): void {
    if (bill.payment_status === 'paid' && !bill.payment_date) {
      bill.payment_date = this.getCurrentDateForInput();
    }
  }

  /**
   * Valida si una factura marcada como pagada tiene fecha de pago
   *
   * @param bill - La factura a validar
   * @returns true si es válida, false si falta la fecha
   */
  validatePaidBillHasDate(bill: Bill): boolean {
    return !(bill.payment_status === 'paid' && !bill.payment_date);
  }

  /**
   * Obtiene el mensaje de validación para factura pagada sin fecha
   *
   * @returns string con el mensaje de error
   */
  getPaidWithoutDateMessage(): string {
    return 'Las facturas marcadas como pagadas deben tener una fecha de pago.';
  }


  // ========================================
  // 🆕 NUEVA FUNCIÓN: calculateTotal()
  // ========================================

  /**
   * 🎯 PARA JUNIOR: Calcula el total de una factura
   * - Si es normal: usa fórmula matemática
   * - Si es proporcional: delega a onProportionalDatesChange del componente
   *
   * @param bill - La factura a calcular
   * @param onProportionalDatesChangeCallback - Función del componente para manejar cálculo proporcional
   */
  calculateTotal(bill: Bill, onProportionalDatesChangeCallback?: () => void): void {
    if (bill.is_proportional === 1) {
      // Si es proporcional, llamar al callback del componente
      if (onProportionalDatesChangeCallback) {
        onProportionalDatesChangeCallback();
      }
    } else {
      // Si es normal, usar cálculo estándar
      const base = parseFloat(bill.tax_base?.toString() || '0') || 0;
      const ivaPercent = parseFloat(bill.iva?.toString() || '0') || 0;
      const irpfPercent = parseFloat(bill.irpf?.toString() || '0') || 0;

      // Fórmula: Total = Base + (Base × IVA%) - (Base × IRPF%)
      const total = base + (base * ivaPercent / 100) - (base * irpfPercent / 100);
      bill.total = parseFloat(total.toFixed(2));
    }
  }

  /**
   * Formatea todas las fechas de una factura para enviar al backend
   * Esto es necesario porque MySQL necesita fechas en formato YYYY-MM-DD
   *
   * @param bill - La factura con fechas a formatear
   * @returns La factura con fechas formateadas
   */
  formatBillDatesForBackend(bill: Bill): Bill {
    // Hacemos una copia de la factura para no modificar la original
    const formattedBill = {...bill};

    // Formateamos cada fecha usando la función que ya tienes
    formattedBill.date = this.formatDateForInput(formattedBill.date);
    formattedBill.payment_date = this.formatDateForInput(formattedBill.payment_date);
    formattedBill.start_date = this.formatDateForInput(formattedBill.start_date);
    formattedBill.end_date = this.formatDateForInput(formattedBill.end_date);

    return formattedBill;
  }


}
