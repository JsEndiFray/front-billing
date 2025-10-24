

/**
 * Interface principal de Internal Expense
 */
export interface InternalExpense{
  id?: number | null;
  expense_date: string;
  category: string;
  subcategory?: string | null;
  description: string;
  amount: number;
  iva_percentage: number;
  iva_amount: number;
  total_amount: number;
  is_deductible: boolean;
  supplier_name: string;
  supplier_nif?: string | null;
  supplier_address?: string | null;
  payment_method: string;
  receipt_number?: string | null;
  receipt_date?: string | null;
  pdf_path?: string | null;
  has_attachments: boolean;
  property_id?: number | null;
  project_code?: string | null;
  cost_center?: string | null;
  notes?: string | null;
  is_recurring: boolean;
  recurrence_period?: string | null;
  next_occurrence_date?: string | null;
  status: string;
  created_by?: number | null;
  approved_by?: number | null;
  approval_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response al crear/actualizar un gasto
 */
export interface ExpenseResponse {
  message: string;
  expense: InternalExpense;
}

/**
 * Estadísticas de gastos
 */
export interface ExpenseStats {
  total_expenses: number;
  pending_expenses: number;
  approved_expenses: number;
  rejected_expenses: number;
  paid_expenses: number;
  total_amount: number;
  total_iva_amount: number;
  deductible_amount: number;
  pending_amount: number;
  average_expense: number;
  approval_rate: number;
}

// ==========================================
// INTERFAZ PARA BÚSQUEDA AVANZADA
// ==========================================

export interface AdvancedSearchFilters {
  category?: string;
  status?: string;
  supplier_name?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  is_deductible?: boolean;
  property_id?: number;
  payment_method?: string;
  is_recurring?: boolean;
}

// ==========================================
// INTERFAZ PARA RESUMEN MENSUAL
// ==========================================

export interface MonthlySummary {
  month: number;
  month_name: string;
  expense_count: number;
  total_amount: number;
  total_iva: number;
  average_amount?: number;
}

// ==========================================
// INTERFAZ PARA ESTADÍSTICAS POR CATEGORÍA
// ==========================================

export interface CategoryStats {
  category: string;
  expense_count: number;
  total_amount: number;
  total_iva: number;
  average_amount: number;
}


