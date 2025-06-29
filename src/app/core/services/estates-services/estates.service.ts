import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Estates} from '../../../interface/estates.interface';

/**
 * Servicio para gestión de propiedades inmobiliarias
 * Wrapper HTTP sobre ApiService para operaciones de estates
 */
@Injectable({
  providedIn: 'root'
})
export class EstatesService {

  constructor(private api: ApiService) {
  }

  // Métodos de consulta
  getAllEstate(): Observable<Estates[]> {
    return this.api.get<Estates[]>('estates');
  }

  getById(id: number): Observable<Estates[]> {
    return this.api.get<Estates[]>(`estates/${id}`);
  }

  getByCadastralReference(cadastral: string): Observable<Estates> {
    return this.api.get<Estates>(`search/cadastral/${cadastral}`);
  }

  // Métodos CRUD
  createEstate(data: Estates): Observable<Estates[]> {
    return this.api.post(`estates`, data)
  }

  updateEstate(id: number, data: Estates): Observable<Estates[]> {
    return this.api.put(`estates/${id}`, data);
  }

  deleteEstate(id: number): Observable<Estates> {
    return this.api.delete<Estates>(`estates/${id}`)
  }
}
