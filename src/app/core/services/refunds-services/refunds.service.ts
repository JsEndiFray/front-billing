import { Injectable } from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Refunds} from '../../../interface/bills-interface';

@Injectable({
  providedIn: 'root'
})
export class RefundsService {

  constructor(private api: ApiService) { }

  // Crear un abono
  createPayment(refunds: Refunds): Observable<Refunds> {
    return this.api.post<Refunds>('bills/refunds', refunds);
  }

  // Obtener abonos de una factura
  getAllPayments(): Observable<Refunds[]> {
    return this.api.get<Refunds[]>('bills/refunds');
  }
}
