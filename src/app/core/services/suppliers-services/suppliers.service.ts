import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Suppliers} from '../../../interfaces/suppliers-interface';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  constructor(
    private api: ApiService,
  ) {
  }

// ==========================================
  // MÉTODOS DE CONSULTA (GET)
  // ==========================================

  getAllSuppliers(): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>('suppliers')
  }


}
