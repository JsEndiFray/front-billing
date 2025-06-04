import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {map, Observable} from 'rxjs';
import {Estates} from '../../../interface/estates.interface';

@Injectable({
  providedIn: 'root'
})
export class EstatesService {


  constructor(private api: ApiService) {
  }
  //métodos de obtener

  //Listado de todos los estates
  getAllEstate(): Observable<Estates[]> {
    return this.api.get<Estates[]>('estates');
  }

  //búsqueda por ID
  getById(id: number): Observable<Estates> {
    return this.api.get<Estates>(`estates/${id}`);
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
  deleteEstate(id: number): Observable<boolean> {
    return this.api.delete<boolean>('estates/' + id)
      .pipe(
        map(() => true)
      )
  }
}
