//listado y registro de clientes
export interface Clients {
  id?: number;
  type_client: string;
  name: string;
  lastname: string;
  company_name: string;
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
}

//listado Backend
export interface ClientResponse {
  data : Clients[];
}
