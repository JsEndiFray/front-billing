import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {User} from '../../../interface/users-interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private api: ApiService,
  ) {
  }

  //MÉTODOS DE OBTENER

//obtener listado
  getUser(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  getById(id: number): Observable<User> {
    return this.api.get<User>(`users/${id}`);
  }

//MÉTODOS DE UPDATE DELETE

  //UPDATE
  updateUser(id: number, data: User): Observable<User> {
    return this.api.put<User>(`users/${id}`, data)
  }

  //DELETE
deleteUser(id: number): Observable<User>{
    return this.api.delete<User>(`users/${id}`);
}

}





