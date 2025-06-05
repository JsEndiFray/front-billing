import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {map, Observable} from 'rxjs';
import {Clients} from '../../../interface/clientes-interface';

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

//obtener la identificacion
  getByIdentification(identification: string): Observable<Clients> {
    return this.api.get<Clients>(`search/identification/${identification}`);
  }

// obtener las compañias
  getCompanies(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients/companies');
  }

// obtener las compañias y autonomos
  getAutonomsWithCompanies(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients/autonoms-with-companies')
  }

//obtener la ID
  getClientById(id: number): Observable<Clients> {
    return this.api.get<Clients>(`clients/${id}`);
  }

// lógica de asociar un autónomo a una empresa
  associateAutonomoToCompany(companyId: number, autonomoId: number): Observable<Clients> {
    const updateData = {
      parent_company_id: companyId,
      relationship_type: 'administrator'
    } as Clients;

    return this.updateClient(autonomoId, updateData);
  }


  //CREATE
  createClientes(client: Clients): Observable<Clients> {
    return this.api.post<Clients, Clients>('clients', client);
  }

  //UPDATE - Método para actualizar cliente
  updateClient(id: number, data: Partial<Clients>): Observable<Clients> {
    return this.api.put<Clients>(`clients/${id}`, data as Clients);
  }

  //DELETE:
  deleleteUser(id: number): Observable<boolean> {
    return this.api.delete<void>(`clients/${id}`)
      .pipe(
        map(() => true) // El backend devuelve 204 No Content, lo convertimos a boolean
      );
  }
}
