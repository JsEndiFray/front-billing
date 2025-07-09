import {Injectable} from '@angular/core';
import {Bill} from '../../../interface/bills-interface';

@Injectable({
  providedIn: 'root'
})
export class BillsValidatorService {

  constructor() {
  }

  /**
   * Limpia y transforma datos de facturas
   */

  cleanBillsData(bill: Bill): Bill {
    return {
      id: bill.id,
      estates_id: bill.estates_id,
      clients_id: bill.clients_id,
      owners_id: bill.owners_id,
      ownership_percent: bill.ownership_percent,
      date: bill.date,
      tax_base: bill.tax_base,
      iva: bill.iva,
      irpf: bill.irpf,
      total: bill.total,
      is_refund: bill.is_refund,
      original_bill_id: bill.original_bill_id,

      //NUEVOS CAMPOS DE PAGO INCLUIDOS
      payment_status: bill.payment_status || 'pending',
      payment_method: bill.payment_method || 'transfer',
      payment_date: bill.payment_date,
      payment_notes: bill.payment_notes || '',

      //🆕 NUEVOS CAMPOS PROPORCIONALES INCLUIDOS
      start_date: bill.start_date,
      end_date: bill.end_date,
      corresponding_month: bill.corresponding_month,
      is_proportional: bill.is_proportional,


      date_create: bill.date_create,
      date_update: bill.date_update
    } as Bill;
  }

//validaciones
  validateRequiredFields(bill: Bill): { isValid: boolean; message?: string } {

    if (!bill.estates_id ||
      !bill.clients_id ||
      !bill.owners_id ||
      !bill.date ||
      !bill.tax_base ||
      bill.iva === null || bill.iva === undefined ||
      bill.irpf === null || bill.irpf === undefined
    ) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }
    //VALIDACIÓN ADICIONAL: Si está marcado como pagado, debe tener fecha
    if (bill.payment_status === 'paid' && !bill.payment_date) {
      return {
        isValid: false,
        message: 'Las facturas marcadas como pagadas deben tener una fecha de pago.'
      }
    }


    return {isValid: true};
  }


  //valicaciones completas
  validateBills(bill: Bill): { isValid: boolean; message?: string } {
    const cleanData = this.cleanBillsData(bill);

    const requiredValidation = this.validateRequiredFields(cleanData);
    if (!requiredValidation.isValid) return requiredValidation;


    return {isValid: true}
  }


}
