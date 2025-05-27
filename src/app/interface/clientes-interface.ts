//listado y registro de clientes
export interface Clients {
  id?: number;
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
  parent_company_id?: number;
  relationship_type?: 'administrador';
  parent_company_name?: string;

}

//listado Backend
export interface ClientResponse {
  data : Clients[];
}

//INTERFACE PARA EMPRESAS EN DROPDOWN
export interface CompanyOption {
  id: number;
  company_name: string;
}
