import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Owners} from '../../../interface/owners-interface';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OwnersService {

  constructor(private api: ApiService) {
  }

  //métodos de obtener o búsquedas

  //listado de propietarios
  getOwners(): Observable<Owners[]> {
    return this.api.get<Owners[]>('owners');
  }

  //obtener la ID
  getOwnerById(id: number): Observable<Owners> {
    return this.api.get<Owners>(`owners/${id}`);
  }

  //create
  createOwners(owners: Owners): Observable<Owners> {
    return this.api.post<Owners>('owners', owners);
  }

  //update
  updateOwners(id: number, data: Owners): Observable<Owners> {
    return this.api.put<Owners>(`owners/${id}`, data)
  }


  //delete
  deleteOwner(id: number): Observable<Owners> {
    return this.api.delete<Owners>(`owners/${id}`)

  }


}
