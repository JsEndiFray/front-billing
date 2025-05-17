import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {EstateDTO, Estates} from '../../../interface/estates.interface';

@Injectable({
  providedIn: 'root'
})
export class EstateService {


  constructor(private api: ApiService) {
  }


  //métodos de obtener
  //Listado de todos los estates
  getAllEstate(): Observable<{ estate: Estates[] }> {
    return this.api.get<{ estate: Estates[] }>('estates');
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
  createEstate(data: EstateDTO): Observable<EstateDTO> {
    return this.api.post<EstateDTO>(`estates`, data)
  }

  //update


  //delete

}
