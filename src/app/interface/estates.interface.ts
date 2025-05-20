//listado y registro de inmuebles
export interface Estates {
  id?: number | null;
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

//Listado del Backend
export interface EstateArray {
  msg: string
  data:  Estates[];

}
//editar el inmueble
export interface EstateEdit {
  msg: string;
  data: Estates;
}
