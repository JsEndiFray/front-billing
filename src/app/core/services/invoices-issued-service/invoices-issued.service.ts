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
  InvoiceStats,
  ClientStats,
  OwnerStats,
  VATBookDataEntry,
  IncomeStatementEntry,
  MonthlySummary
} from '../../../interface/invoices-issued-interface';
import {HttpClient} from '@angular/common/http';

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

  // ==========================================
  // MÉTODOS DE OBTENER Y BÚSQUEDAS
  // ==========================================

  /**
   * Obtiene todas las facturas emitidas del sistema.
   * @returns Observable con la lista de facturas.
   */
  getAllInvoicesIssued(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('invoices-issued');
  }

  /**
   * Obtiene una factura emitida por su ID.
   * @param id El ID de la factura.
   * @returns Observable con la factura.
   */
  getInvoiceById(id: number): Observable<Invoice> {
    return this.api.get<Invoice>(`invoices-issued/${id}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene una factura emitida por su número.
   * @param invoice_number El número de la factura.
   * @returns Observable con la factura.
   */
  getInvoiceByNumber(invoice_number: string): Observable<Invoice> {
    return this.api.get<Invoice>(`invoices-issued/search/${invoice_number}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene todas las facturas emitidas para un propietario específico.
   * @param ownerId El ID del propietario.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByOwnerId(ownerId: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/owners/${ownerId}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene todas las facturas emitidas para un cliente específico.
   * @param clientId El ID del cliente.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByClientId(clientId: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/clients/${clientId}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene el historial de facturas emitidas para un cliente por su NIF.
   * @param nif El NIF del cliente.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByClientNif(nif: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/clients/nif/${nif}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene facturas emitidas por estado de cobro.
   * @param status El estado de cobro.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByCollectionStatus(status: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/collection-status/${status}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene facturas emitidas vencidas.
   * @returns Observable con la lista de facturas.
   */
  getOverdueInvoices(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/overdue`); // Ruta de la API actualizada
  }

  /**
   * Obtiene facturas emitidas próximas a vencer.
   * @param days Número de días para considerar "próximo".
   * @returns Observable con la lista de facturas.
   */
  getInvoicesDueSoon(days: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/due-soon?days=${days}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene facturas por rango de fechas (usando POST para el body).
   * @param startDate Fecha de inicio.
   * @param endDate Fecha de fin.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByDateRange(startDate: string, endDate: string): Observable<Invoice[]> {
    const body: DateRangeValidation = { startDate, endDate };
    // Esto es correcto: DateRangeValidation es el tipo del cuerpo (T), Invoice[] es el tipo de la respuesta (R)
    return this.api.post<DateRangeValidation, Invoice[]>(`invoices-issued/date-range`, body);
  }

  /**
   * Obtiene facturas por mes de correspondencia.
   * @param month Mes en formato YYYY-MM.
   * @returns Observable con la lista de facturas.
   */
  getInvoicesByCorrespondingMonth(month: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/month/${month}`); // Ruta de la API actualizada
  }

  /**
   * Obtiene todas las facturas que son abonos (rectificativas).
   * @returns Observable con la lista de abonos.
   */
  getAllRefunds(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/refunds`); // Ruta de la API actualizada
  }

  // ==========================================
  // OPERACIONES CRUD
  // ==========================================

  /**
   * Crea una nueva factura emitida.
   * @param invoice Los datos de la factura a crear.
   * @returns Observable con la factura creada.
   */
  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.api.post<Invoice>('invoices-issued', invoice); // Ruta de la API actualizada
  }

  /**
   * Actualiza una factura emitida existente.
   * @param id El ID de la factura a actualizar.
   * @param invoice Los datos actualizados de la factura.
   * @returns Observable con la factura actualizada.
   */
  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.api.put<Invoice>(`invoices-issued/${id}`, invoice); // Ruta de la API actualizada
  }

  /**
   * Elimina una factura emitida por su ID.
   * @param id El ID de la factura a eliminar.
   * @returns Observable con la respuesta de la eliminación.
   */
  deleteInvoice(id: number): Observable<object> { // Cambiado de 'any' a 'object' para respuesta vacía o con mensaje
    return this.api.delete<object>(`invoices-issued/${id}`); // Ruta de la API actualizada
  }

  // ==========================================
  // GESTIÓN DE COBROS
  // ==========================================

  /**
   * Actualiza el estado de cobro de una factura emitida.
   * @param id El ID de la factura.
   * @param collectionData Los datos del cobro (estado, método, fecha, etc.).
   * @returns Observable con la factura actualizada.
   */
  updateCollectionStatus(id: number, collectionData: Partial<Invoice>): Observable<Invoice> {
    return this.api.put<Invoice>(`invoices-issued/${id}/collection`, collectionData); // Ruta de la API actualizada
  }

  // ==========================================
  // ABONOS (CREAR RECTIFICATIVAS)
  // ==========================================

  /**
   * Crea un abono (factura rectificativa) a partir de una factura original.
   * @param refundData Los datos necesarios para el abono.
   * @returns Observable con el abono creado.
   */
  createRefund(refundData: RefundInvoice): Observable<Invoice> {
    return this.api.post('invoices-issued/refunds', refundData);
  }

  // ==========================================
  // DESCARGA DE PDF
  // ==========================================

  /**
   * Descarga un PDF de una factura emitida.
   * @param id El ID de la factura.
   * @returns Observable con el Blob del PDF.
   */
  downloadInvoicePdf(id: number): Observable<Blob> {
    // Nota: this.api.baseUrl es utilizado por ApiService, por lo que se asume que lo expone
    // o que HttpClient es usado directamente para controlar responseType.
    // Si ApiService ya tiene un método para blobs, úsalo. Si no, esta es la forma directa con HttpClient.
    return this.http.get(`${this.api.baseUrl}/invoices-issued/${id}/pdf`, { // Ruta de la API actualizada
      responseType: 'blob'
    });
  }

  /**
   * Descarga un PDF de un abono.
   * @param id El ID del abono.
   * @returns Observable con el Blob del PDF.
   */
  downloadRefundInvoicePdf(id: number): Observable<Blob> {
    // Igual que downloadInvoicePdf, si ApiService no maneja blobs directamente.
    return this.http.get(`${this.api.baseUrl}/invoices-issued/refunds/${id}/pdf`, { // Ruta de la API actualizada
      responseType: 'blob'
    });
  }

  // ==========================================
  // FACTURACIÓN PROPORCIONAL
  // ==========================================

  /**
   * Simula el cálculo de una factura proporcional.
   * @param simulationData Datos para la simulación.
   * @returns Observable con el resultado de la simulación.
   */
  simulateProportionalBilling(simulationData: ProportionalSimulation): Observable<ProportionalSimulationResponse> {
    return this.api.post<ProportionalSimulation, ProportionalSimulationResponse>('invoices-issued/simulate-proportional', simulationData);
  }

  /**
   * Obtiene los detalles de cálculo proporcional para una factura existente.
   * @param id El ID de la factura.
   * @returns Observable con los detalles del cálculo.
   */
  getProportionalCalculationDetails(id: number): Observable<ProportionalCalculationDetails> {
    return this.api.get<ProportionalCalculationDetails>(`invoices-issued/${id}/proportional-details`); // Ruta de la API actualizada
  }

  /**
   * Valida un rango de fechas para facturación proporcional.
   * @param dateRange Datos con fecha de inicio y fin.
   * @returns Observable con el resultado de la validación.
   */
  validateProportionalDates(dateRange: DateRangeValidation): Observable<DateRangeValidationResponse> {
    return this.api.post<DateRangeValidation, DateRangeValidationResponse>('invoices-issued/validate-proportional-dates', dateRange);
  }

  // ==========================================
  // ESTADÍSTICAS Y REPORTES
  // ==========================================

  /**
   * Obtiene estadísticas generales de facturas emitidas.
   * @returns Observable con las estadísticas.
   */
  getInvoiceStats(): Observable<InvoiceStats> {
    return this.api.get<InvoiceStats>('invoices-issued/stats');
  }

  /**
   * Obtiene estadísticas de facturas emitidas por cliente.
   * @returns Observable con las estadísticas por cliente.
   */
  getStatsByClient(): Observable<ClientStats[]> {
    return this.api.get<ClientStats[]>('invoices-issued/stats/client');
  }

  /**
   * Obtiene estadísticas de facturas emitidas por propietario.
   * @returns Observable con las estadísticas por propietario.
   */
  getStatsByOwner(): Observable<OwnerStats[]> {
    return this.api.get<OwnerStats[]>('invoices-issued/stats/owner');
  }

  /**
   * Obtiene datos para el libro de IVA repercutido.
   * @param year Año fiscal.
   * @param month Mes opcional.
   * @returns Observable con los datos del libro de IVA.
   */
  getVATBookData(year: number, month?: number): Observable<VATBookDataEntry[]> {
    let endpoint = `invoices-issued/vat-book/${year}`;
    if (month) {
      endpoint += `?month=${month.toString()}`; // CAMBIO: Añadir el parámetro de consulta directamente a la URL
    }
    return this.api.get<VATBookDataEntry[]>(endpoint);
  }

  /**
   * Obtiene el balance de ingresos.
   * @param year Año fiscal.
   * @param month Mes opcional.
   * @returns Observable con el balance de ingresos.
   */
  getIncomeStatement(year: number, month?: number): Observable<IncomeStatementEntry[]> {
    let endpoint = `invoices-issued/income-statement/${year}`;
    if (month) {
      endpoint += `?month=${month.toString()}`; // CAMBIO: Añadir el parámetro de consulta directamente a la URL
    }
    return this.api.get<IncomeStatementEntry[]>(endpoint);
  }

  /**
   * Obtiene el resumen mensual de facturación.
   * @param year Año fiscal.
   * @returns Observable con el resumen mensual.
   */
  getMonthlySummary(year: number): Observable<MonthlySummary[]> {
    return this.api.get<MonthlySummary[]>(`invoices-issued/monthly-summary/${year}`);
  }

  /**
   * Obtiene facturas emitidas pendientes con envejecimiento (aging).
   * @returns Observable con la lista de facturas.
   */
  getPendingInvoicesAging(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoices-issued/aging`);
  }
}
