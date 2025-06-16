import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {EstatesOwners} from '../../../interface/estates-owners-interface';


@Injectable({
  providedIn: 'root'
})
export class EstateOwnersService {

  constructor(
    private api: ApiService,
  ) {
  }

  //métodos de obtener
  getAllOwnerships(): Observable<EstatesOwners[]> {
    return this.api.get<EstatesOwners[]>('estate-owners')
  }

  //búsqueda por ID
  getOwnersShipById(id: number): Observable<EstatesOwners> {
    return this.api.get<EstatesOwners>(`estate-owners/${id}`)
  }

  //create
  createOwnersEstates(data: EstatesOwners): Observable<EstatesOwners> {
    return this.api.post<EstatesOwners>('estate-owners', data)
  }

  //update
  updateOwnersEstates(id: number, data: EstatesOwners): Observable<EstatesOwners> {
    return this.api.put<EstatesOwners>(`estate.owners/${id}`, data)
  }

  //delete
  deleteOwnersEstates(id: number): Observable<EstatesOwners> {
    return this.api.delete<EstatesOwners>(`estate-owners/${id}`)
  }


}
