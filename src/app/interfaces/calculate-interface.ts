// En un archivo de interfaces común
 export interface CalculableInvoice {
  tax_base?: number | null;
  iva?: number | null;
  iva_percentage?: number | null;
  irpf?: number | null;
  irpf_percentage?:number | null;
  is_proportional?: number | null;
  total?: number | null;
  total_amount?: number | null;
}
