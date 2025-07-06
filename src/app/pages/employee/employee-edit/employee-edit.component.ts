import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Employee} from '../../../interface/employee-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {EmployeeService} from '../../../core/services/employee-services/employee-service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {EmployeeValidatorServices} from '../../../core/services/validator-services/employee-validator.service';

@Component({
  selector: 'app-employee-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './employee-edit.component.html',
  styleUrl: './employee-edit.component.css'
})
export class EmployeeEditComponent implements OnInit {

  employee: Employee = {
    name: '',
    lastname: '',
    email: '',
    identification: '',
    phone: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: '',
    date_update: ''
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private employeeServices: EmployeeService,
    private employeeValidator: EmployeeValidatorServices,
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.employeeServices.getEmployeeById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.employee = data[0];
            }

          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })
  }

  /**
   * Actualiza los datos del empleado
   * Valida información antes de enviar al servidor
   */
  updateEmployee() {
    // Verificar que el propietario tenga ID válido
    if (this.employee.id == null) {
      Swal.fire({
        title: 'Error',
        text: 'ID de usuario no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Limpiar espacios y preparar datos
    const cleanEmployee = this.employeeValidator.cleanEmployeeData(this.employee);
    // Validar que todos los campos estén correctos
    const validation = this.employeeValidator.validateEmployee(cleanEmployee);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Enviar datos actualizados al servidor
    this.employeeServices.updateEmployee(this.employee.id, cleanEmployee).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.employee = data[0];
          Swal.fire({
            title: '¡Éxito!',
            text: 'Empleado actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          // Regresar a la lista de propietarios
          this.router.navigate(['/dashboard/employee/list'])
        }

      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  goBack() {
    this.router.navigate(['/dashboard/employee/list'])
  }
}
