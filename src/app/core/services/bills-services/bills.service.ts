import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {
  Bill,
  DateRangeValidation,
  DateRangeValidationResponse, ProportionalCalculationDetails,
  ProportionalSimulation, ProportionalSimulationResponse
} from '../../../interface/bills-interface';
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
  getBillById(id: number): Observable<Bill[]> {
    return this.api.get<Bill[]>(`bills/${id}`)
  }

  //DESCARGA DE PDF
  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/bills/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  //DESCARGA DE PDF DE ABONO
  downloadRefundPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/bills/refunds/${id}/pdf`, {
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

  //NUEVOS MÉTODOS PARA FACTURACIÓN PROPORCIONAL

  //VALIDAR RANGO DE FECHAS PROPORCIONAL
  validateProportionalDates(dateRange: DateRangeValidation): Observable<DateRangeValidationResponse> {
    return this.api.post('bills/validate-proportional-dates', dateRange)
  }

  //SIMULAR FACTURA PROPORCIONAL
  simulateProportionalBilling(simulation: ProportionalSimulation): Observable<ProportionalSimulationResponse> {
    return this.api.post('bills/simulate-proportional', simulation)
  }

  //OBTENER DETALLES DE CÁLCULO PROPORCIONAL
  getProportionalDetails(id: number): Observable<ProportionalCalculationDetails> {
    return this.api.get(`bills/${id}/proportional-details`)
  }

}
