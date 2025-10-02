/**
 * Interface principal de Supplier
 */
export interface Suppliers {
  id?: number;
  name?: string;
  company_name?: string | null;
  tax_id?: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  payment_terms?: number;
  bank_account?: string | null;
  notes?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}
