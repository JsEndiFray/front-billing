import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Employee} from '../../../interface/employee-interface';
import {EmployeeService} from '../../../core/services/employee-services/employee-service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {SearchService} from '../../../core/services/search-services/search.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';

@Component({
  selector: 'app-employee-list',
  imports: [
    FormsModule,
    DataFormatPipe
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit {

  // Lista de propietarios que se muestra en la tabla
  employees: Employee[] = [];

  // Lista completa de propietarios (datos originales sin filtrar)
  allEmployees: Employee[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
    this.getListEmployee();
  }

  /**
   * Obtiene todos los empleados del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListEmployee() {
    this.employeeService.getEmployee().subscribe({
      next: (data) => {
        this.employees = data;
        this.allEmployees = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  /**
   * Filtra la lista de empleados según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  filterEmployee() {
    this.employees = this.searchService.filterWithFullName(
      this.allEmployees,          //Lista completa de empleados
      this.searchTerm,      //Lo que el usuario escribió para buscar
      `name`,               //Primer campo que se usa para buscar (nombre)
      'lastname',       //Segundo campo que se usa (apellido)
      ['phone', 'identification']//Campos adicionales donde también se busca
    )
  }

  /**
   * Limpia el filtro de búsqueda y muestra todos los propietarios
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterEmployee();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterEmployee();
  }

  /**
   * Navega a la página de edición del empleado
   */
  editEmployee(id: number) {
    this.router.navigate(['/dashboards/employee/edit', id])
  }

  /**
   * Elimina un empleado después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteEmployee(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Empleado eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListEmployee();

          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })

  }

  newEmployee() {
    this.router.navigate(['/dashboards/employee/register'])
  }

}
