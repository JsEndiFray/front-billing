import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {EstateArray, EstateEdit, Estates} from '../../../interface/estates.interface';

@Injectable({
  providedIn: 'root'
})
export class EstatesService {


  constructor(private api: ApiService) {
  }


  //métodos de obtener

  //Listado de todos los estates
  getAllEstate(): Observable<EstateArray> {
    return this.api.get<EstateArray>('estates');
  }

  //búsqueda por ID
  getById(id: number): Observable<EstateEdit> {
    return this.api.get<EstateEdit>(`estates/${id}`);
  }

  //búsqueda por catastro
  getByCadastralReference(cadastral: string): Observable<Estates> {
    return this.api.get<Estates>(`search/cadastral/${cadastral}`);
  }

  //métodos CREATE UPDATE DELETE

  //create
  createEstate(data: Estates): Observable<Estates> {
    return this.api.post<Estates>(`estates`, data)
  }

  //update
  updateEstate(id: number, data: Estates): Observable<Estates> {
    return this.api.put<Estates>(`estates/${id}`, data);
  }

  //delete
  deleteEstate(id: number): Observable<Estates> {
    return this.api.delete<Estates>('estates/' + id);
  }
}
