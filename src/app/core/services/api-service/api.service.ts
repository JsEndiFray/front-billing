import {Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment.development';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl
  }

  //métodos de obtener
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
  }

  //métodos CREATE UPDATE DELETE
  post<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http.post<R>(`${this.apiUrl}/${endpoint}`, data);
  }

  put<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http.put<R>(`${this.apiUrl}/${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }


}
