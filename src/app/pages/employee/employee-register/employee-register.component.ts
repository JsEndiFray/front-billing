import {Component} from '@angular/core';
import {Employee} from '../../../interfaces/employee-interface';
import {EmployeeService} from '../../../core/services/employee-services/employee.service';
import {EmployeeValidatorServices} from '../../../core/services/validator-services/employee-validator.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-employee-register',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './employee-register.component.html',
  styleUrl: './employee-register.component.css'
})
export class EmployeeRegisterComponent {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  employeeForm: FormGroup;

  constructor(
    private employeeServices: EmployeeService,
    private employeeValidator: EmployeeValidatorServices,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      identification: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.maxLength(5)]],
      location: ['', Validators.required],
      province: ['', Validators.required],
      country: ['ESPAÑA'],
      date_create: [''],
      date_update: ['']
    });
  }

  /**
   * Registra un nuevo empleado en el sistema
   * Valida todos los datos antes de enviar al servidor
   */
  createEmployee() {

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    // Obtener datos del FormGroup
    const formData = this.employeeForm.value;

    // Limpiar espacios y preparar datos
    const cleanEmp = this.employeeValidator.cleanEmployeeData(formData);

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
