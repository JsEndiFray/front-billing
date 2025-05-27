import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {map, Observable} from 'rxjs';
import {ClientResponse, Clients, CompanyOption} from '../../../interface/clientes-interface';

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

  getCompanies(): Observable<CompanyOption[]> {
    return this.api.get<{data: CompanyOption[]}>('clients/companies')
      .pipe(
        map(response => response.data || [])
      )
  }

  //CREATE
  createClientes(client: Clients):Observable<Clients>{
    return this.api.post<Clients>('clients', client )
  }

  //UPDATE

  //DELETE


}
