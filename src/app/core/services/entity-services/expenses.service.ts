import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  InternalExpense,
  ExpenseResponse,
  ExpenseStats, AdvancedSearchFilters, MonthlySummary
} from '../../../interfaces/expenses-interface';
import {VATBookEntry} from '../../../interfaces/vat-book-interface';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {
  }

  // ==========================================
  // MÉTODOS DE CONSULTA (GET)
  // ==========================================

  /**
   * Obtiene todos los gastos internos
   */
  getAllExpenses(): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>('internal-expenses');
  }

  /**
   * Obtiene un gasto por ID
   */
  getExpenseById(id: number): Observable<InternalExpense> {
    return this.api.get<InternalExpense>(`internal-expenses/${id}`);
  }

  /**
   * Busca gastos por categoría
   */
  getExpensesByCategory(category: string): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>(`internal-expenses/category/${category}`);
  }

  /**
   * Busca gastos por estado
   */
  getExpensesByStatus(status: string): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>(`internal-expenses/status/${status}`);
  }

  /**
   * Busca gastos por proveedor
   */
  getExpensesBySupplier(supplierName: string): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>(`internal-expenses/supplier/${supplierName}`);
  }

  /**
   * Busca gastos deducibles
   */
  getDeductibleExpenses(): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>('internal-expenses/deductible');
  }

  /**
   * Busca gastos recurrentes
   */
  getRecurringExpenses(): Observable<InternalExpense[]> {
    return this.api.get<InternalExpense[]>('internal-expenses/recurring');
  }

  /**
   * Búsqueda avanzada con múltiples filtros
   */
  getExpensesAdvanced(filters: AdvancedSearchFilters): Observable<InternalExpense[]> {
    return this.api.post<AdvancedSearchFilters, InternalExpense[]>('internal-expenses/advanced-search', filters);
  }

  /**
   * Obtiene estadísticas de gastos
   */
  getExpenseStats(): Observable<ExpenseStats> {
    return this.api.get<ExpenseStats>('internal-expenses/stats');
  }

  /**
   * Obtiene resumen mensual
   */
  getMonthlySummary(year: number): Observable<MonthlySummary[]> {
    return this.api.get<MonthlySummary[]>(`internal-expenses/monthly-summary/${year}`);
  }

  /**
   * Obtiene datos para el libro de IVA
   */
  getVATBookData(year: number, month?: number): Observable<VATBookEntry[]> {
    let endpoint = `internal-expenses/vat-book/${year}`;
    if (month) {
      endpoint += `?month=${month}`;
    }
    return this.api.get<VATBookEntry[]>(endpoint);
  }

  // ==========================================
  // MÉTODOS DE MODIFICACIÓN (POST/PUT/DELETE)
  // ==========================================

  /**
   * Crea un nuevo gasto
   */
  createExpense(expense: InternalExpense, file?: File): Observable<{ message: string, expense: InternalExpense }> {
    const formData = new FormData();

    // Agregar todos los campos del gasto
    Object.keys(expense).forEach(key => {
      const value = expense[key as keyof InternalExpense];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Agregar archivo si existe
    if (file) {
      formData.append('invoice_file', file);
    }

    return this.http.post<{ message: string, expense: InternalExpense }>(
      `${this.api.baseUrl}/internal-expenses`,
      formData
    );
  }


  /**
   * Actualiza un gasto existente
   */
  updateExpense(id: number, expense: InternalExpense, file?: File): Observable<{
    message: string,
    expense: InternalExpense
  }> {
    const formData = new FormData();

    // Agregar todos los campos del gasto
    Object.keys(expense).forEach(key => {
      const value = expense[key as keyof InternalExpense];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Agregar archivo si existe
    if (file) {
      formData.append('invoice_file', file);
    }

    return this.http.put<{ message: string, expense: InternalExpense }>(
      `${this.api.baseUrl}/internal-expenses/${id}`,
      formData
    );
  }

  /**
   * Elimina un gasto
   */
  deleteExpense(id: number): Observable<void> {
    return this.api.delete<void>(`internal-expenses/${id}`);
  }

  /**
   * Aprueba un gasto
   */
  approveExpense(id: number, approvedBy?: string): Observable<ExpenseResponse> {
    return this.api.put<{ approved_by?: string }, ExpenseResponse>(
      `internal-expenses/${id}/approve`,
      {approved_by: approvedBy}
    );
  }

  /**
   * Rechaza un gasto
   */
  rejectExpense(id: number, approvedBy?: string): Observable<ExpenseResponse> {
    return this.api.put<{ approved_by?: string }, ExpenseResponse>(
      `internal-expenses/${id}/reject`,
      {approved_by: approvedBy}
    );
  }

  /**
   * Marca un gasto como pagado
   */
  markExpenseAsPaid(id: number): Observable<ExpenseResponse> {
    return this.api.put<Record<string, never>, ExpenseResponse>(
      `internal-expenses/${id}/pay`,
      {}
    );
  }

  /**
   * Actualiza el estado de un gasto
   */
  updateExpenseStatus(id: number, status: string, approvedBy?: string): Observable<ExpenseResponse> {
    return this.api.put<{ status: string, approved_by?: string }, ExpenseResponse>(
      `internal-expenses/${id}/status`,
      {status, approved_by: approvedBy}
    );
  }

  /**
   * Descarga un archivo adjunto de gasto
   */
  downloadAttachment(fileName: string): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/internal-expenses/files/${fileName}`, {
      responseType: 'blob'
    });
  }
}
