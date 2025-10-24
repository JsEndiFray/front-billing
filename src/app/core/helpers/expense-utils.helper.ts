import { Injectable } from '@angular/core';
import { InternalExpense } from '../../interfaces/expenses-interface';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  DEDUCTIBLE_LABELS
} from '../../shared/Collection-Enum/collection-enum';
import {DataTransformHelper} from './data-transform.helper';
import {EntityValidationHelper} from './entity-validation.helper';


/**
 * Servicio de utilidades para gastos internos (Expenses)
 * REFACTORIZADO: Delega transformaciones y validaciones básicas a servicios especializados
 *
 * RESPONSABILIDADES:
 * - Lógica específica de expenses (workflow, filtrado, estadísticas)
 * - Labels y clases CSS para expenses
 * - Cálculos específicos de expenses
 * - Preparación de datos para crear/actualizar gastos
 */
@Injectable({
  providedIn: 'root'
})
export class ExpensesUtilHelper {

  constructor(
    private dataTransform: DataTransformHelper,
    private entityValidation: EntityValidationHelper
  ) { }

  // ==========================================================
  // MÉTODOS DELEGADOS (Ahora usan los servicios base)
  // ==========================================================

  /**
   * Formatea un monto con 2 decimales y símbolo €
   * DELEGADO a DataTransformHelper
   */
  formatAmount(amount: unknown): string {
    const num = this.dataTransform.parseNumber(amount);
    return `${num.toFixed(2)}€`;
  }

  /**
   * Formatea un monto sin símbolo de moneda
   * DELEGADO a DataTransformHelper
   */
  formatAmountPlain(amount: unknown): string {
    return this.dataTransform.formatAmountPlain(amount);
  }

  /**
   * Formatea un monto con separador de miles
   * DELEGADO a DataTransformHelper
   */
  formatAmountLocale(amount: unknown): string {
    return this.dataTransform.formatAmountLocale(amount);
  }

  /**
   * Formatea fecha en formato español
   * DELEGADO a DataTransformHelper
   */
  formatDate(date: unknown): string {
    return this.dataTransform.formatDateLocale(date);
  }

  /**
   * Formatea fecha para inputs HTML (YYYY-MM-DD)
   * DELEGADO a DataTransformHelper
   */
  formatDateForInput(dateString: unknown): string | undefined {
    return this.dataTransform.formatDateForInput(dateString);
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * DELEGADO a DataTransformHelper
   */
  getCurrentDateForInput(): string {
    return this.dataTransform.getCurrentDateForInput();
  }

  /**
   * Trunca un texto a una longitud máxima
   * DELEGADO a DataTransformHelper
   */
  truncateText(text: unknown, maxLength: number = 50): string {
    return this.dataTransform.truncateText(text, maxLength);
  }

  /**
   * Calcula el total de un gasto (base + IVA)
   * DELEGADO a DataTransformHelper (parseNumber)
   */
  calculateTotal(amount: unknown, ivaPercentage: unknown): number {
    const baseAmount = this.dataTransform.parseNumber(amount);
    const ivaPercent = this.dataTransform.parseNumber(ivaPercentage);
    const ivaAmount = (baseAmount * ivaPercent) / 100;
    return baseAmount + ivaAmount;
  }

  /**
   * Calcula el monto de IVA
   * DELEGADO a DataTransformHelper (parseNumber)
   */
  calculateIVAAmount(amount: unknown, ivaPercentage: unknown): number {
    const baseAmount = this.dataTransform.parseNumber(amount);
    const ivaPercent = this.dataTransform.parseNumber(ivaPercentage);
    return (baseAmount * ivaPercent) / 100;
  }

  /**
   * Valida si un gasto tiene todos los campos obligatorios
   * DELEGADO a EntityValidationHelper
   */
  isExpenseValid(expense: InternalExpense): boolean {
    const validation = this.entityValidation.validateExpense(expense);
    return validation.isValid;
  }

  /**
   * Obtiene el mensaje de error de validación
   * DELEGADO a EntityValidationHelper
   */
  getExpenseValidationMessage(expense: InternalExpense): string | undefined {
    const validation = this.entityValidation.validateExpense(expense);
    return validation.message;
  }

  // ==========================================================
  // PREPARACIÓN DE DATOS (NUEVO - ELIMINA DUPLICACIÓN)
  // ==========================================================

  /**
   * Prepara los datos del formulario para crear/actualizar un gasto
   * Centraliza toda la lógica de transformación y cálculos
   *
   * @param formValues - Valores del formulario
   * @param existingId - ID del gasto (solo para edición)
   * @param existingStatus - Estado actual (solo para edición)
   * @param existingPdfPath - Ruta del PDF existente (solo para edición)
   * @returns Objeto InternalExpense listo para enviar al backend
   */
  prepareExpenseData(
    formValues: ExpenseFormValues,
    existingId?: number | null,
    existingStatus?: string,
    existingPdfPath?: string | null
  ): InternalExpense {
    // Calcular valores numéricos
    const amount = this.dataTransform.parseNumber(formValues['amount']);
    const ivaPercentage = this.dataTransform.parseNumber(formValues['iva_percentage']);
    const ivaAmount = this.calculateIVAAmount(amount, ivaPercentage);
    const totalAmount = this.calculateTotal(amount, ivaPercentage);

    // Construir objeto base
    const expense: InternalExpense = {
      expense_date: String(formValues['expense_date']),
      category: String(formValues['category']),
      description: String(formValues['description']),
      amount,
      iva_percentage: ivaPercentage,
      iva_amount: ivaAmount,
      total_amount: totalAmount,
      supplier_name: String(formValues['supplier_name']),
      payment_method: String(formValues['payment_method']),
      is_deductible: this.dataTransform.toBoolean(formValues['is_deductible']),

      // Campos opcionales simples
      subcategory: this.dataTransform.trimOrUndefined(String(formValues['subcategory'])),
      supplier_nif: this.dataTransform.trimOrUndefined(String(formValues['supplier_nif'])),
      supplier_address: this.dataTransform.trimOrUndefined(String(formValues['supplier_address'])),
      receipt_number: this.dataTransform.trimOrUndefined(String(formValues['receipt_number'])),
      receipt_date: formValues['receipt_date'] ? String(formValues['receipt_date']) : undefined,
      property_id: formValues['property_id'] ? Number(formValues['property_id']) : undefined,
      project_code: this.dataTransform.trimOrUndefined(String(formValues['project_code'])),
      cost_center: this.dataTransform.trimOrUndefined(String(formValues['cost_center'])),
      notes: this.dataTransform.trimOrUndefined(String(formValues['notes'])),

      // Campos de recurrencia
      is_recurring: this.dataTransform.toBoolean(formValues['is_recurring']),
      recurrence_period: this.dataTransform.toBoolean(formValues['is_recurring'])
        ? String(formValues['recurrence_period'])
        : undefined,
      next_occurrence_date: this.dataTransform.toBoolean(formValues['is_recurring'])
        ? String(formValues['next_occurrence_date'])
        : undefined,

      // Estado (pending para crear, existingStatus para editar)
      status: existingStatus || 'pending'
    } as InternalExpense;

    // Agregar campos solo para edición
    if (existingId !== null && existingId !== undefined) {
      expense.id = existingId;
    }

    if (existingPdfPath) {
      expense.pdf_path = existingPdfPath;
    }

    return expense;
  }

  // ==========================================================
  // MÉTODOS ESPECÍFICOS DE EXPENSES (NO SE MUEVEN)
  // ==========================================================

  /**
   * Obtiene la etiqueta legible para una categoría de gasto
   * ESPECÍFICO: Solo para expenses
   */
  getCategoryLabel(category: string | undefined): string {
    if (!category) return '-';
    return EXPENSE_CATEGORY_LABELS.find(item => item.value === category)?.label || category;
  }

  /**
   * Obtiene la etiqueta legible para un estado de gasto
   * ESPECÍFICO: Solo para expenses
   */
  getStatusLabel(status: string | undefined): string {
    if (!status) return '-';
    return EXPENSE_STATUS_LABELS.find(item => item.value === status)?.label || status;
  }

  /**
   * Obtiene la etiqueta legible para un método de pago
   * ESPECÍFICO: Solo para expenses
   */
  getPaymentMethodLabel(method: string | undefined): string {
    if (!method) return '-';
    return EXPENSE_PAYMENT_METHOD_LABELS.find(item => item.value === method)?.label || method;
  }

  /**
   * Obtiene la etiqueta legible para deducible
   * ESPECÍFICO: Solo para expenses
   */
  getDeductibleLabel(isDeductible: boolean | undefined): string {
    if (isDeductible === undefined) return '-';
    return DEDUCTIBLE_LABELS.find(item => item.value === isDeductible)?.label || '-';
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   * ESPECÍFICO: Lógica de presentación para expenses
   */
  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'approved':
        return 'approved-badge';
      case 'paid':
        return 'paid-badge';
      case 'rejected':
        return 'rejected-badge';
      case 'pending':
      default:
        return 'pending-badge';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de deducible
   * ESPECÍFICO: Lógica de presentación para expenses
   */
  getDeductibleClass(isDeductible: boolean | undefined): string {
    return isDeductible ? 'deductible-badge' : 'non-deductible-badge';
  }

  /**
   * Obtiene la clase CSS para una categoría
   * ESPECÍFICO: Lógica de presentación para expenses
   */
  getCategoryClass(category: string | undefined): string {
    if (!category) return 'category-default';
    return `category-${category.toLowerCase().replace(/_/g, '-')}`;
  }

  // ==========================================================
  // WORKFLOW DE EXPENSES (PERMISOS DE ACCIONES)
  // ==========================================================

  /**
   * Verifica si se puede aprobar o rechazar un gasto
   * ESPECÍFICO: Lógica de negocio de expenses
   */
  canApproveReject(expense: InternalExpense): boolean {
    return expense.status === 'pending';
  }

  /**
   * Verifica si se puede marcar un gasto como pagado
   * ESPECÍFICO: Lógica de negocio de expenses
   */
  canMarkAsPaid(expense: InternalExpense): boolean {
    return expense.status === 'approved';
  }

  /**
   * Verifica si se puede eliminar un gasto
   * ESPECÍFICO: Lógica de negocio de expenses
   */
  canDelete(expense: InternalExpense): boolean {
    return expense.status === 'pending';
  }

  /**
   * Verifica si se puede editar un gasto
   * ESPECÍFICO: Lógica de negocio de expenses
   */
  canEdit(expense: InternalExpense): boolean {
    return expense.status === 'pending' || expense.status === 'rejected';
  }

  /**
   * Obtiene el estado siguiente en el workflow
   * ESPECÍFICO: Lógica de negocio de expenses
   */
  getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case 'pending':
        return 'approved';
      case 'approved':
        return 'paid';
      default:
        return null;
    }
  }

  // ==========================================================
  // FILTRADO Y BÚSQUEDA
  // ==========================================================

  /**
   * Filtra gastos por rango de fechas
   * ESPECÍFICO: Lógica de filtrado de expenses
   */
  filterByDateRange(
    expenses: InternalExpense[],
    startDate?: string,
    endDate?: string
  ): InternalExpense[] {
    if (!startDate && !endDate) return expenses;

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);

      if (startDate && expenseDate < new Date(startDate)) return false;
      if (endDate && expenseDate > new Date(endDate)) return false;

      return true;
    });
  }

  /**
   * Calcula el total de una lista de gastos
   * ESPECÍFICO: Lógica de cálculo para expenses
   */
  calculateTotalAmount(expenses: InternalExpense[]): number {
    return expenses.reduce((total, expense) => total + (expense.total_amount || 0), 0);
  }

  /**
   * Agrupa gastos por categoría
   * ESPECÍFICO: Lógica de agrupación para expenses
   */
  groupByCategory(expenses: InternalExpense[]): { [category: string]: InternalExpense[] } {
    return expenses.reduce((groups, expense) => {
      const category = expense.category || 'sin_categoria';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(expense);
      return groups;
    }, {} as { [category: string]: InternalExpense[] });
  }

  /**
   * Obtiene estadísticas de gastos
   * ESPECÍFICO: Lógica de estadísticas para expenses
   */
  getExpenseStats(expenses: InternalExpense[]) {
    const total = this.calculateTotalAmount(expenses);
    const deductible = expenses
      .filter(e => e.is_deductible)
      .reduce((sum, e) => sum + (e.total_amount || 0), 0);

    const byStatus = {
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      paid: expenses.filter(e => e.status === 'paid').length,
      rejected: expenses.filter(e => e.status === 'rejected').length
    };

    return {
      totalExpenses: expenses.length,
      totalAmount: total,
      deductibleAmount: deductible,
      nonDeductibleAmount: total - deductible,
      byStatus
    };
  }
}

/**
 * Tipo para los valores del formulario de gastos
 * Usa Omit para excluir campos calculados y de sistema
 * Esto evita duplicación con InternalExpense
 */
export type ExpenseFormValues = Omit<
  InternalExpense,
  | 'id'
  | 'iva_amount'
  | 'total_amount'
  | 'status'
  | 'has_attachments'
  | 'created_by'
  | 'approved_by'
  | 'approval_date'
  | 'created_at'
  | 'updated_at'
  | 'pdf_path'
>;
