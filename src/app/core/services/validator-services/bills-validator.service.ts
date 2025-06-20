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
      date: bill.date,
      tax_base: bill.tax_base,
      iva: bill.iva,
      irpf: bill.irpf,
      total: bill.total
    } as Bill;
  }

//validaciones
  validateRequiredFields(bill: Bill): { isValid: boolean; message?: string } {

    if (!bill.estates_id ||
      !bill.clients_id ||
      !bill.owners_id ||
      !bill.date ||
      !bill.tax_base ||
      !bill.iva ||
      !bill.irpf
    ) {
      return {
        isValid: false,
        message: 'Todos los campos son obligatorios.'
      }
    }


    return {isValid: true};
  }


  //valicaciones completas
  validateBills(bill: Bill): { isValid: boolean; message?: string } {
    const cleanData = this.cleanBillsData(bill);

    const requiredValidation = this.validateRequiredFields(cleanData);
    if(!requiredValidation.isValid) return requiredValidation;


    return {isValid: true}
  }


}
