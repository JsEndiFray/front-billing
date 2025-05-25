import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {ClientResponse, Clients} from '../../../interface/clientes-interface';
import {Estates} from '../../../interface/estates.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  constructor(private api: ApiService) {
  }


  //obtener listados
  getClients(): Observable<ClientResponse> {
    return this.api.get<ClientResponse>('clients')
  }

  getByIdentification(identification: string):Observable<Clients>{
    return this.api.get<Clients>(`search/identification/${identification}`);
  }

  //CREATE
  createClientes(estate: Estates):Observable<Estates>{
    return this.api.post<Estates>('clients', estate )
  }

  //UPDATE

  //DELETE


}
