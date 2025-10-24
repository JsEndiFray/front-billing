import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiService} from '../api-service/api.service';
import {InvoiceReceived} from '../../../interfaces/invoices-received-interface';

/**
 * Servicio de Angular para interactuar con el backend de facturas recibidas de proveedores.
 * Se encarga de las operaciones CRUD y de la comunicación HTTP.
 * Maneja facturas de proveedores, estados de pago, categorías y reportes.
 */
@Injectable({
  providedIn: 'root'
})
export class InvoicesReceivedService {

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {
  }

  // ==========================================
  // MÉTODOS DE CONSULTA (GET)
  // ==========================================

  //Obtiene todas las facturas recibidas con información del proveedor
  getAllInvoicesReceived(): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>('invoices-received');
  }

  //Obtiene una factura recibida por su ID
  getInvoiceById(id: number): Observable<InvoiceReceived> {
    return this.api.get<InvoiceReceived>(`invoices-received/${id}`);
  }

  //Busca facturas por número de factura del proveedor
  getInvoiceByNumber(invoiceNumber: string): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/search/${invoiceNumber}`);
  }

  //Obtiene facturas por proveedor específico
  getInvoicesBySupplierId(supplierId: number): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/supplier/${supplierId}`);
  }

  /**
   * Obtiene facturas por categoría de gasto
   * @param category - Categoría: electricidad, gas, agua, telefono, internet, mantenimiento, limpieza, seguridad, seguros, impuestos, servicios_profesionales, suministros, otros
   */
  getInvoicesByCategory(category: string): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/category/${category}`);
  }

  /**
   * Obtiene facturas por estado de pago
   * @param status - Estado: pending, paid, overdue, disputed
   */
  getInvoicesByPaymentStatus(status: string): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/payment-status/${status}`);
  }

  //Obtiene facturas vencidas (overdue)
  getOverdueInvoices(): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>('invoices-received/overdue');
  }

  /**
   * Obtiene facturas próximas a vencer
   * @param days - Días de antelación (por defecto 7)
   * @returns Observable<InvoiceReceived[]> - Facturas próximas a vencer
   */
  getInvoicesDueSoon(days: number = 7): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/due-soon?days=${days}`);
  }

  /**
   * Obtiene facturas por rango de fechas
   * @param startDate - Fecha de inicio (YYYY-MM-DD)
   * @param endDate - Fecha de fin (YYYY-MM-DD)
   * @returns Observable<InvoiceReceived[]> - Facturas en el rango
   */
  getInvoicesByDateRange(startDate: string, endDate: string): Observable<InvoiceReceived[]> {
    const body = {startDate, endDate};
    return this.api.post<typeof body, InvoiceReceived[]>('invoices-received/date-range', body);
  }

  /**
   * Obtiene todas las facturas que son abonos (rectificativas)
   * @returns Observable<InvoiceReceived[]> - Lista de abonos
   */
  getAllRefunds(): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>('invoices-received/refunds');
  }

  // ==========================================
  // OPERACIONES CRUD
  // ==========================================

  /**
   * Crea una nueva factura recibida
   * @param invoice - Datos de la factura a crear
   * @returns Observable<{message: string, invoice: InvoiceReceived}> - Factura creada
   */
  createInvoiceReceived(invoice: Partial<InvoiceReceived>, file?: File): Observable<{ message: string, invoice: InvoiceReceived }> {
    const formData = new FormData();

    // Agregar todos los campos de la factura
    Object.keys(invoice).forEach(key => {
      const value = invoice[key as keyof InvoiceReceived];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Agregar archivo si existe
    if (file) {
      formData.append('invoice_file', file);
    }

    return this.http.post<{ message: string, invoice: InvoiceReceived }>(`${this.api.baseUrl}/invoices-received`, formData);
  }

  /**
   * Actualiza una factura recibida existente
   * @param id - ID de la factura
   * @param invoice - Nuevos datos de la factura
   * @returns Observable<{message: string, invoice: InvoiceReceived}> - Factura actualizada
   */
  updateInvoiceReceived(id: number, invoice: Partial<InvoiceReceived>, file?: File): Observable<{message: string, invoice: InvoiceReceived}>{
    const formData = new FormData();

    // Agregar todos los campos de la factura
    Object.keys(invoice).forEach(key => {
      const value = invoice[key as keyof InvoiceReceived];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Agregar archivo si existe
    if (file) {
      formData.append('invoice_file', file);
    }

    return this.http.put<{ message: string, invoice: InvoiceReceived }>(`${this.api.baseUrl}/invoices-received/${id}`, formData);
  }

  /**
   * Elimina una factura recibida
   * @param id - ID de la factura a eliminar
   * @returns Observable<void> - Confirmación de eliminación
   */
  deleteInvoiceReceived(id: number): Observable<void> {
    return this.api.delete<void>(`invoices-received/${id}`);
  }

  // ==========================================
  // GESTIÓN DE PAGOS
  // ==========================================

  /**
   * Actualiza el estado de pago de una factura
   * @param id - ID de la factura
   * @param paymentData - Datos del pago
   * @returns Observable<{message: string, invoice: InvoiceReceived}> - Factura con pago actualizado
   */
  updatePaymentStatus(id: number, paymentData: {
    collection_status: 'pending' | 'paid' | 'overdue' | 'disputed';
    collection_method: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
    collection_date?: string;
    collection_reference?: string;
    collection_notes?: string;
  }): Observable<{ message: string, invoice: InvoiceReceived }> {

    return this.api.put<typeof paymentData, {
      message: string,
      invoice: InvoiceReceived
    }>(`invoices-received/${id}/payment`, paymentData);
  }

  // ==========================================
  // ABONOS (CREAR RECTIFICATIVAS)
  // ==========================================

  /**
   * Crea un abono (factura rectificativa) basado en una factura original
   * @param originalInvoiceId - ID de la factura original
   * @param refundReason - Motivo del abono
   * @returns Observable<{message: string, refund: InvoiceReceived}> - Abono creado
   */
  createRefund(originalInvoiceId: number, refundReason?: string): Observable<{
    message: string,
    refund: InvoiceReceived
  }> {
    const body = {originalInvoiceId, refundReason};
    return this.api.post<typeof body, { message: string, refund: InvoiceReceived }>('invoices-received/refunds', body);
  }

  // ==========================================
  // DESCARGA DE PDF
  // ==========================================

  /**
   * Descarga un PDF de una factura recibida
   * @param id - ID de la factura
   * @returns Observable<Blob> - Archivo PDF
   */
  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/invoices-received/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Descarga un PDF de un abono
   * @param id - ID del abono
   * @returns Observable<Blob> - Archivo PDF del abono
   */
  downloadRefundInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/invoices-received/refunds/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Descarga un archivo adjunto de factura
   * @param fileName - Nombre del archivo
   * @returns Observable<Blob> - Archivo PDF
   */
  downloadAttachment(fileName: string): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/invoices-received/files/${fileName}`, {
      responseType: 'blob'
    });
  }

  // ==========================================
  // ESTADÍSTICAS Y REPORTES
  // ==========================================

  /**
   * Obtiene estadísticas generales de facturas recibidas
   * @returns Observable<any> - Estadísticas generales
   */
  getInvoiceStats(): Observable<InvoiceReceived> {
    return this.api.get<InvoiceReceived>('invoices-received/stats');
  }

  /**
   * Obtiene estadísticas por categoría de gasto
   * @returns Observable<any[]> - Estadísticas por categoría
   */
  getStatsByCategory(): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>('invoices-received/stats/category');
  }

  /**
   * Obtiene datos para el libro de IVA soportado
   * @param year - Año para el libro de IVA
   * @param month - Mes específico (opcional)
   * @returns Observable<any[]> - Datos del libro de IVA soportado
   */
  getVATBookData(year: number, month?: number): Observable<InvoiceReceived[]> {
    let endpoint = `invoices-received/vat-book/${year}`;
    if (month) {
      endpoint += `?month=${month}`;
    }
    return this.api.get<InvoiceReceived[]>(endpoint);
  }

  /**
   * Obtiene el balance de gastos
   * @param year - Año para el balance
   * @param month - Mes específico (opcional)
   * @returns Observable<any[]> - Balance de gastos
   */
  getExpenseStatement(year: number, month?: number): Observable<InvoiceReceived[]> {
    let endpoint = `invoices-received/expense-statement/${year}`;
    if (month) {
      endpoint += `?month=${month}`;
    }
    return this.api.get<InvoiceReceived[]>(endpoint);
  }

  /**
   * Obtiene resumen mensual de facturas recibidas
   * @param year - Año para el resumen
   * @returns Observable<any[]> - Resumen mensual
   */
  getMonthlySummary(year: number): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>(`invoices-received/monthly-summary/${year}`);
  }

  /**
   * Obtiene facturas pendientes con aging (antigüedad)
   * @returns Observable<InvoiceReceived[]> - Facturas pendientes con información de aging
   */
  getPendingInvoicesAging(): Observable<InvoiceReceived[]> {
    return this.api.get<InvoiceReceived[]>('invoices-received/aging');
  }
}
