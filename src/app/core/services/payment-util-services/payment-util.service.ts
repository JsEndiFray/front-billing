import { Injectable } from '@angular/core';
import {Bill} from '../../../interface/bills-interface';

@Injectable({
  providedIn: 'root'
})
export class PaymentUtilService {

  constructor() { }

  /**
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
        bill.payment_date = new Date().toISOString().split('T')[0];
      }
    } else {
      // Si marca como pendiente, limpiar fecha de pago
      bill.payment_date = null;
    }
  }

  /**
   * Inicializa valores por defecto para los campos de pago
   * Útil para facturas nuevas
   *
   * @param bill - La factura a inicializar
   */
  initializePaymentDefaults(bill: Bill): void {
    if (bill.payment_status === 'paid' && !bill.payment_date) {
      bill.payment_date = new Date().toISOString().split('T')[0];
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
}
