import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Suppliers,} from '../../../interfaces/suppliers-interface';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  constructor(private api: ApiService) {
  }

  // ==========================================
  // MÉTODOS DE CONSULTA (GET)
  // ==========================================

  /**
   * Obtiene todos los proveedores activos
   */
  getAllSuppliers(): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>('suppliers');
  }

  /**
   * Obtiene todos los proveedores (incluyendo inactivos)
   */
  getAllSuppliersIncludingInactive(): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>('suppliers/all');
  }

  /**
   * Obtiene un proveedor por ID
   */
  getSupplierById(id: number): Observable<Suppliers> {
    return this.api.get<Suppliers>(`suppliers/${id}`);
  }

  /**
   * Busca proveedor por CIF/NIF
   */
  getSupplierByTaxId(taxId: string): Observable<Suppliers> {
    return this.api.get<Suppliers>(`suppliers/tax/${taxId}`);
  }

  /**
   * Busca proveedores por nombre
   */
  getSuppliersByName(name: string): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>(`suppliers/search/${name}`);
  }

  /**
   * Busca proveedores por términos de pago
   */
  getSuppliersByPaymentTerms(paymentTerms: number): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>(`suppliers/payment-terms/${paymentTerms}`);
  }

  /**
   * Obtiene estadísticas de proveedores
   */
  getSupplierStats(): Observable<Suppliers> {
    return this.api.get<Suppliers>('suppliers/stats');
  }

  /**
   * Obtiene sugerencias para autocompletado
   */
  getSupplierSuggestions(query: string): Observable<Suppliers[]> {
    return this.api.get<Suppliers[]>(`suppliers/suggestions?q=${query}`);
  }

  // ==========================================
  // MÉTODOS DE MODIFICACIÓN (POST/PUT/DELETE)
  // ==========================================

  /**
   * Crea un nuevo proveedor
   */
  createSupplier(supplierData: Suppliers): Observable<Suppliers> {
    return this.api.post<Suppliers>('suppliers', supplierData);
  }

  /**
   * Actualiza un proveedor existente
   */
  updateSupplier(id: number, supplierData: Suppliers): Observable<Suppliers> {
    return this.api.put< Suppliers>(`suppliers/${id}`, supplierData);
  }

  /**
   * Elimina un proveedor (borrado lógico)
   */
  deleteSupplier(id: number): Observable<void> {
    return this.api.delete<void>(`suppliers/${id}`);
  }

  /**
   * Reactiva un proveedor inactivo
   */
  activateSupplier(id: number): Observable<{ message: string }> {
    return this.api.put<Record<string, never>, { message: string }>(`suppliers/${id}/activate`, {});
  }
}
