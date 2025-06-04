import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {map, Observable} from 'rxjs';
import {Clients, CompanyOption} from '../../../interface/clientes-interface';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  constructor(private api: ApiService) {
  }

  //obtener listados
  getClients(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients');
  }

  getByIdentification(identification: string): Observable<Clients> {
    return this.api.get<Clients>(`search/identification/${identification}`);
  }

  getCompanies(): Observable<CompanyOption[]> {
    return this.api.get<CompanyOption[]>('clients/companies');
  }

  getClientById(id: number): Observable<Clients> {
    return this.api.get<Clients>(`clients/${id}`);
  }

  //CREATE
  createClientes(client: Clients): Observable<Clients> {
    return this.api.post<Clients, Clients>('clients', client);
  }

  //UPDATE - Método para obtener cliente por ID


  //UPDATE - Método para actualizar cliente
  updateClient(id: number, data: Clients): Observable<Clients> {
    return this.api.put<Clients>(`clients/${id}`, data);
  }

  //DELETE:
  deleleteUser(id: number): Observable<boolean> {
    return this.api.delete<void>(`clients/${id}`)
      .pipe(
        map(() => true) // El backend devuelve 204 No Content, lo convertimos a boolean
      );
  }
}
