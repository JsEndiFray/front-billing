/**
 * Interface para facturas - datos base
 */
export interface Bill {
  id?: number | null;
  bill_number?: string;
  estates_id: string | null;
  clients_id: string | null;
  owners_id: string | null;
  ownership_percent?: number | null;
  date: string;
  tax_base: number | null;
  iva: number | null;
  irpf: number | null;
  total: number | null;
  is_refund?: number | null ;
  original_bill_id?: number | null;
  original_bill_number?: string | null;
  date_create?: string;
  date_update?: string;

}
