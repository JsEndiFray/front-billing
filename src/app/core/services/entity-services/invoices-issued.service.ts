import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {
  Invoice,
  DateRangeValidation,
  DateRangeValidationResponse,
  ProportionalCalculationDetails,
  ProportionalSimulation,
  ProportionalSimulationResponse,
  RefundInvoice,
} from '../../../interfaces/invoices-issued-interface';
import {HttpClient} from '@angular/common/http';
//import {MonthlySummary} from '../../../interfaces/expenses-interface';
import {ClientStats, InvoiceStats, OwnerStats} from '../../../interfaces/stats-interface';



/**
 * Servicio de Angular para interactuar con el backend de facturas emitidas.
 * Se encarga de las operaciones CRUD y de la comunicación HTTP.
 */
@Injectable({
  providedIn: 'root'
})
export class InvoicesIssuedService {

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {
  }

  // Métodos de consulta
  getAllInvoicesIssued(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('invoices-issued');
  }

  //Obtiene una factura emitida por su ID.
  getInvoiceById(id: number): Observable<Invoice> {
    return this.api.get<Invoice>(`invoices-issued/${id}`);
  }

  //Obtiene una factura emitida por su número.
  getInvoiceByNumber(invoice_number: string): Observable<Invoice> {
    return this.api.get<Invoice>(`invoices-issued/search/${invoice_number}`);
  }

  //Obtiene todas las facturas emitidas para un propietario específico.
  getInvoicesByOwnerId(ownerId: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/owners/${ownerId}`);
  }

  //Obtiene todas las facturas emitidas para un cliente específico.
  getInvoicesByClientId(clientId: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/clients/${clientId}`);
  }

  //Obtiene el historial de facturas emitidas para un cliente por su NIF.
  getInvoicesByClientNif(nif: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/clients/nif/${nif}`);
  }

  //Obtiene facturas emitidas por estado de cobro.
  getInvoicesByCollectionStatus(status: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/collection-status/${status}`);
  }

  //Obtiene facturas emitidas vencidas.
  getOverdueInvoices(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/overdue`);
  }

  //Obtiene facturas emitidas próximas a vencer.
  getInvoicesDueSoon(days: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/due-soon?days=${days}`);
  }

  //Obtiene facturas por rango de fechas (usando POST para el body).
  getInvoicesByDateRange(startDate: string, endDate: string): Observable<Invoice[]> {
    const body: DateRangeValidation = {startDate, endDate};
    // Esto es correcto: DateRangeValidation es el tipo del cuerpo (T), Invoice[] es el tipo de la respuesta (R)
    return this.api.post<DateRangeValidation, Invoice[]>(`invoices-issued/date-range`, body);
  }

  //Obtiene facturas por mes de correspondencia.
  getInvoicesByCorrespondingMonth(month: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/month/${month}`);
  }

  //Obtiene todas las facturas que son abonos (rectificativas).
  getAllRefunds(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/refunds`);
  }

  // ==========================================
  // OPERACIONES CRUD
  // ==========================================

  //Crea una nueva factura emitida.
  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.api.post<Invoice>('invoices-issued', invoice);
  }

  //Actualiza una factura emitida existente.
  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.api.put<Invoice>(`invoices-issued/${id}`, invoice);
  }

  //Elimina una factura emitida por su ID.
  deleteInvoice(id: number): Observable<object> {
    return this.api.delete<object>(`invoices-issued/${id}`);
  }

  // ==========================================
  // GESTIÓN DE COBROS
  // ==========================================

  //Actualiza el estado de cobro de una factura emitida.
  updateCollectionStatus(id: number, collectionData: Partial<Invoice>): Observable<Invoice> {
    return this.api.put<Invoice>(`invoices-issued/${id}/collection`, collectionData);
  }

  // ==========================================
  // ABONOS (CREAR RECTIFICATIVAS)
  // ==========================================

  //Crea un abono (factura rectificativa) a partir de una factura original.
  createRefund(refundData: RefundInvoice): Observable<Invoice> {
    return this.api.post('invoices-issued/refunds', refundData);
  }

  // ==========================================
  // DESCARGA DE PDF
  // ==========================================

  //Descarga un PDF de una factura emitida.
  downloadInvoicePdf(id: number): Observable<Blob> {
    // Nota: this.api.baseUrl es utilizado por ApiService, por lo que se asume que lo expone
    // o que HttpClient es usado directamente para controlar responseType.
    // Si ApiService ya tiene un método para blobs, úsalo. Si no, esta es la forma directa con HttpClient.
    return this.http.get(`${this.api.baseUrl}/invoices-issued/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  //Descarga un PDF de un abono
  downloadRefundInvoicePdf(id: number): Observable<Blob> {
    // Igual que downloadInvoicePdf, si ApiService no maneja blobs directamente.
    return this.http.get(`${this.api.baseUrl}/invoices-issued/refunds/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  // ==========================================
  // FACTURACIÓN PROPORCIONAL
  // ==========================================

  //Simula el cálculo de una factura proporcional.
  simulateProportionalBilling(simulationData: ProportionalSimulation): Observable<ProportionalSimulationResponse> {
    return this.api.post<ProportionalSimulation, ProportionalSimulationResponse>('invoices-issued/simulate-proportional', simulationData);
  }

  //Obtiene los detalles de cálculo proporcional para una factura existente.
  getProportionalCalculationDetails(id: number): Observable<ProportionalCalculationDetails> {
    return this.api.get<ProportionalCalculationDetails>(`invoices-issued/${id}/proportional-details`);
  }

  //Valida un rango de fechas para facturación proporcional.
  validateProportionalDates(dateRange: DateRangeValidation): Observable<DateRangeValidationResponse> {
    return this.api.post<DateRangeValidation, DateRangeValidationResponse>('invoices-issued/validate-proportional-dates', dateRange);
  }

  // ==========================================
  // ESTADÍSTICAS Y REPORTES
  // ==========================================

  //Obtiene estadísticas generales de facturas emitidas.
  getInvoiceStats(): Observable<InvoiceStats> {
    return this.api.get<InvoiceStats>('invoices-issued/stats');
  }

  //Obtiene estadísticas de facturas emitidas por cliente.
  getStatsByClient(): Observable<ClientStats[]> {
    return this.api.get<ClientStats[]>('invoices-issued/stats/client');
  }

  //Obtiene estadísticas de facturas emitidas por propietario.
  getStatsByOwner(): Observable<OwnerStats[]> {
    return this.api.get<OwnerStats[]>('invoices-issued/stats/owner');
  }

 /* //Obtiene datos para el libro de IVA repercutido.
  getVATBookData(year: number, month?: number): Observable<VATBookDataEntry[]> {
    let endpoint = `invoices-issued/vat-book/${year}`;
    if (month) {
      endpoint += `?month=${month.toString()}`;
    }
    return this.api.get<VATBookDataEntry[]>(endpoint);
  }

  //Obtiene el balance de ingresos.
  getIncomeStatement(year: number, month?: number): Observable<IncomeStatementEntry[]> {
    let endpoint = `invoices-issued/income-statement/${year}`;
    if (month) {
      endpoint += `?month=${month.toString()}`; // CAMBIO: Añadir el parámetro de consulta directamente a la URL
    }
    return this.api.get<IncomeStatementEntry[]>(endpoint);
  }

  //Obtiene el resumen mensual de facturación.
  getMonthlySummary(year: number): Observable<MonthlySummary[]> {
    return this.api.get<MonthlySummary[]>(`invoices-issued/monthly-summary/${year}`);
  }

  //Obtiene facturas emitidas pendientes con envejecimiento (aging).
  getPendingInvoicesAging(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/aging`);
  }*/
}
