import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Bill} from '../../../interface/bills-interface';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BillsService {

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {
  }

  //MÉTODOS DE OBTENER Y BÚSQUEDAS
  getAllBills(): Observable<Bill[]> {
    return this.api.get<Bill[]>('bills')
  }

  //búsqueda por ID
  getBillById(id: number): Observable<Bill[]>{
    return this.api.get<Bill[]>(`bills/${id}`)
  }

  //DESCARGA DE PDF
  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/bills/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  //CREATE
  createBills(data: Bill): Observable<Bill[]> {
    return this.api.post('bills', data)
  }

  //UPDATE
  updateBills(id: number, data: Bill): Observable<Bill[]> {
    return this.api.put(`bills/${id}`, data)
  }

  //DELETE
  deleteBills(id: number): Observable<Bill[]> {
    return this.api.delete<Bill[]>(`bills/${id}`)
  }

  //NUEVO MÉTODO PARA ACTUALIZAR ESTADO DE PAGO
  updatePaymentStatus(id: number, paymentData: Bill): Observable<Bill[]> {
    return this.api.put(`bills/${id}/payment`, paymentData);
  }

}
