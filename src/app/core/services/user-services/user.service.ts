import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {User} from '../../../interface/users-interface';

/**
 * Servicio para gestión de usuarios del sistema
 * Wrapper HTTP sobre ApiService para operaciones de usuarios
 * Nota: Creación de usuarios se maneja en AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private api: ApiService) {}

  // Métodos de consulta
  getUser(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  getById(id: number): Observable<User[]> {
    return this.api.get<User[]>(`users/${id}`);
  }

  // Métodos de modificación
  updateUser(id: number, data: User): Observable<User[]> {
    return this.api.put(`users/${id}`, data)
  }

  deleteUser(id: number): Observable<User> {
    return this.api.delete<User>(`users/${id}`);
  }
}
