//para el formulario
export interface Estates {
  id: number | null;
  cadastral_reference: string;
  price: number | null;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  surface: number | null;
  date_create?: Date;
  date_update?: Date;
}

//para el envío al backend
export interface EstateDTO {
  cadastral_reference: string;
  price: number | null;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  surface: number | null;
}

//este para sacar los datos del backend
export interface EstateResponse {
  estate: Estates[];
}
