import {Component} from '@angular/core';
import {Employee} from '../../../interface/employee-interface';
import {EmployeeService} from '../../../core/services/employee-services/employee-service';
import {EmployeeValidatorServices} from '../../../core/services/validator-services/employee-validator.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-employee-register',
  imports: [
    FormsModule
  ],
  templateUrl: './employee-register.component.html',
  styleUrl: './employee-register.component.css'
})
export class EmployeeRegisterComponent {

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
    date_create: '',
    date_update: ''
  }


  constructor(
    private employeeServices: EmployeeService,
    private employeeValidator: EmployeeValidatorServices,
    private router: Router,
  ) {
  }

  /**
   * Registra un nuevo empleado en el sistema
   * Valida todos los datos antes de enviar al servidor
   */
  createEmployee() {
    // Limpiar espacios y preparar datos
    const cleanEmp = this.employeeValidator.cleanEmployeeData(this.employee);

    // Validar que todos los campos estén correctos
    const validation = this.employeeValidator.validateEmployee(cleanEmp);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }
    // Enviar datos al servidor
    this.employeeServices.createEmployee(cleanEmp).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Empleado registrado correctamente",
          icon: "success",
          draggable: true
        });
        // Redirigir a la lista después del registro exitoso
        this.router.navigate(['/dashboards/employee/list']);
      }, error: (e: HttpErrorResponse) => {
      }
    })

  }


  goBack() {
    this.router.navigate(['/dashboards/employee/list'])
  };

}
