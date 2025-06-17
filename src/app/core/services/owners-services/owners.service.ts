import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Owners} from '../../../interface/owners-interface';
import {Observable} from 'rxjs';

/**
 * Servicio para gestión de propietarios
 * Wrapper HTTP sobre ApiService para operaciones de owners
 */
@Injectable({
  providedIn: 'root'
})
export class OwnersService {

  constructor(private api: ApiService) {}

  // Métodos de consulta
  getOwners(): Observable<Owners[]> {
    return this.api.get<Owners[]>('owners');
  }

  getOwnerById(id: number): Observable<Owners> {
    return this.api.get<Owners>(`owners/${id}`);
  }

  // Métodos CRUD
  createOwners(owners: Owners): Observable<Owners> {
    return this.api.post<Owners>('owners', owners);
  }

  updateOwners(id: number, data: Owners): Observable<Owners> {
    return this.api.put<Owners>(`owners/${id}`, data)
  }

  deleteOwner(id: number): Observable<Owners> {
    return this.api.delete<Owners>(`owners/${id}`)
  }
}
