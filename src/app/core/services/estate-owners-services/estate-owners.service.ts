import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {EstatesOwners} from '../../../interface/estates-owners-interface';

/**
 * Servicio para gestión de relaciones propiedad-propietario
 * Wrapper HTTP sobre ApiService para operaciones de estate-owners
 */
@Injectable({
  providedIn: 'root'
})
export class EstateOwnersService {

  constructor(private api: ApiService) {}

  // Métodos de consulta
  getAllEstateOwners(): Observable<EstatesOwners[]> {
    return this.api.get<EstatesOwners[]>('estate-owners')
  }

  getEstatesOwnersById(id: number): Observable<EstatesOwners> {
    return this.api.get<EstatesOwners>(`estate-owners/${id}`)
  }

  // Métodos CRUD
  createEstateOwners(data: EstatesOwners): Observable<EstatesOwners> {
    return this.api.post<EstatesOwners>('estate-owners', data)
  }

  updateEstateOwners(id: number, data: EstatesOwners): Observable<EstatesOwners> {
    return this.api.put<EstatesOwners>(`estate-owners/${id}`, data)
  }

  deleteEstateOwners(id: number): Observable<EstatesOwners> {
    return this.api.delete<EstatesOwners>(`estate-owners/${id}`)
  }
}
