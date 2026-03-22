import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}


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
    return this.http
      .get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`)
      .pipe(map((response) => response.data));
  }

  // Método POST genérico
  post<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http
      .post<ApiResponse<R>>(`${this.apiUrl}/${endpoint}`, data)
      .pipe(map((response) => response.data));
  }

  // Método PUT genérico
  put<T, R = T>(endpoint: string, data: T): Observable<R> {
    return this.http
      .put<ApiResponse<R>>(`${this.apiUrl}/${endpoint}`, data)
      .pipe(map((response) => response.data));
  }

  // Método DELETE genérico
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`)
      .pipe(map((response) => response.data));
  }

  //Getter público para exponer la URL base
  get baseUrl(): string {
    return this.apiUrl;
  }
}
