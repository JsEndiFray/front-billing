import {Injectable} from '@angular/core';
import {ApiService} from '../api-service/api.service';
import {Observable} from 'rxjs';
import {Employee} from '../../../interface/employee-interface';

/**
 * Servicio para gestión de empleados
 * Wrapper HTTP sobre ApiService para operaciones de empleados
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor(private api: ApiService) {
  }

  // Métodos de consulta
  getEmployee(): Observable<Employee[]> {
    return this.api.get<Employee[]>('employee')
  }

  getEmployeeById(id: number): Observable<Employee[]> {
    return this.api.get<Employee[]>(`employee/${id}`)
  }

  //CRUD
  createEmployee(employee: Employee): Observable<Employee[]> {
    return this.api.post('employee', employee)
  }

  updateEmployee(id: number, data: Employee): Observable<Employee[]> {
    return this.api.put(`employee/${id}`, data);
  }

  deleteEmployee(id: number): Observable<Employee> {
    return this.api.delete<Employee>(`employee/${id}`)
  }


}
