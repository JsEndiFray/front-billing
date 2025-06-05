//listado y registro de clientes
export interface Clients {
  id?: number | null;
  type_client: string;
  name: string;
  lastname: string;
  company_name?: string;
  identification: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  date_create?: string;
  date_update?: string;
  parent_company_id?: number | null;
  relationship_type?: 'administrator';
  parent_company_name?: string;
}

