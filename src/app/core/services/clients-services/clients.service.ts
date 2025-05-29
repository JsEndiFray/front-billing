import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {map, Observable} from 'rxjs';
import {ClientResponse, Clients, CompanyOption, CreateClientResponse} from '../../../interface/clientes-interface';

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

  getByIdentification(identification: string): Observable<Clients> {
    return this.api.get<Clients>(`search/identification/${identification}`);
  }

  getCompanies(): Observable<CompanyOption[]> {
    return this.api.get<{ data: CompanyOption[] }>('clients/companies')
      .pipe(
        map(response => response.data || [])
      )
  }

  //CREATE - MÉTODO CORREGIDO CON AMBOS TIPOS
  createClientes(client: Clients): Observable<CreateClientResponse> {
    return this.api.post<Clients, CreateClientResponse>('clients', client);
  }

  //UPDATE

  //DELETE:
  deleleteUser(id: number): Observable<Clients> {
    return this.api.delete<Clients>(`clients/` + id);
  }
}
