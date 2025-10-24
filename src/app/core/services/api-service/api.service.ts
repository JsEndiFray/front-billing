import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment.development';


/**
 * Servicio base para llamadas HTTP
 * Wrapper centralizado de HttpClient con URL base configurada
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl
  }

  // Método GET genérico
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
  }


  // Método POST genérico
  post<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http.post<R>(`${this.apiUrl}/${endpoint}`, data);
  }

  // Método PUT genérico
  put<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http.put<R>(`${this.apiUrl}/${endpoint}`, data);
  }

  // Método DELETE genérico
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  //Getter público para exponer la URL base
  get baseUrl(): string {
    return this.apiUrl;
  }
}
