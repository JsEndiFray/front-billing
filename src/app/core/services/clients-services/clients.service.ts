import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable, switchMap} from 'rxjs';
import {Clients} from '../../../interface/clientes-interface';

/**
 * Servicio para gestión de clientes
 * Wrapper HTTP sobre ApiService para operaciones de clientes
 */
@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  constructor(private api: ApiService) {}

  // Métodos de consulta
  getClients(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients');
  }

  getByIdentification(identification: string): Observable<Clients> {
    return this.api.get<Clients>(`search/identification/${identification}`);
  }

  getCompanies(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients/companies');
  }

  getAutonomsWithCompanies(): Observable<Clients[]> {
    return this.api.get<Clients[]>('clients/autonoms-with-companies')
  }

  getClientById(id: number): Observable<Clients> {
    return this.api.get<Clients>(`clients/${id}`);
  }

  /**
   * Asocia cliente existente a empresa como administrador
   * Obtiene datos completos del cliente y los actualiza con la relación
   */
  associateClientToCompany(companyId: number, clientId: number): Observable<Clients> {
    return this.getClientById(clientId).pipe(
      switchMap((clientData: Clients) => {
        const updateData: Partial<Clients> = {
          ...clientData,
          parent_company_id: companyId,
          relationship_type: 'administrator'
        };
        return this.updateClient(clientId, updateData);
      })
    );
  }

  // Métodos CRUD
  createClientes(client: Clients): Observable<Clients> {
    return this.api.post<Clients, Clients>('clients', client);
  }

  updateClient(id: number, data: Partial<Clients>): Observable<Clients> {
    return this.api.put<Clients>(`clients/${id}`, data as Clients);
  }

  deleleteUser(id: number): Observable<Clients> {
    return this.api.delete<Clients>(`clients/${id}`)
  }
}
