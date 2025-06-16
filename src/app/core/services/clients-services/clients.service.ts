import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable, switchMap} from 'rxjs';
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

  // Asociar cualquier cliente a una empresa como administrador
  associateClientToCompany(companyId: number, clientId: number): Observable<Clients> {
    // Primero obtener todos los datos del cliente
    return this.getClientById(clientId).pipe(
      switchMap((clientData: Clients) => {
        // Luego actualizar con todos los datos + la relación
        const updateData: Partial<Clients> = {
          ...clientData,
          parent_company_id: companyId,
          relationship_type: 'administrator'
        };
        return this.updateClient(clientId, updateData);
      })
    );
  }

  //CREATE
  createClientes(client: Clients): Observable<Clients> {
    return this.api.post<Clients, Clients>('clients', client);
  }

  //UPDATE
  updateClient(id: number, data: Partial<Clients>): Observable<Clients> {
    return this.api.put<Clients>(`clients/${id}`, data as Clients);
  }

  //DELETE:
  deleleteUser(id: number): Observable<Clients> {
    return this.api.delete<Clients>(`clients/${id}`)
  }
}
