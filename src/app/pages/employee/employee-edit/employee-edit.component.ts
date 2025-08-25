import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Employee} from '../../../interfaces/employee-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {EmployeeService} from '../../../core/services/employee-services/employee.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {EmployeeValidatorServices} from '../../../core/services/validator-services/employee-validator.service';

@Component({
  selector: 'app-employee-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './employee-edit.component.html',
  styleUrl: './employee-edit.component.css'
})
export class EmployeeEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  employeeForm: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private employeeServices: EmployeeService,
    private employeeValidator: EmployeeValidatorServices,
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

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.employeeServices.getEmployeeById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              const employee = data[0];

              this.employeeForm.patchValue({
                name: employee.name,
                lastname: employee.lastname,
                email: employee.email,
                identification: employee.identification,
                phone: employee.phone,
                address: employee.address,
                postal_code: employee.postal_code,
                location: employee.location,
                province: employee.province,
                country: employee.country,
                date_update: employee.date_update
              })
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

    // Verificar que el formulario sea válido
    if (!this.employeeForm.valid) {
      this.employeeForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    // ✅ Usar directamente los valores del FormGroup
    const formData = this.employeeForm.value;


    // Limpiar espacios y preparar datos
    const cleanEmployee = this.employeeValidator.cleanEmployeeData(formData);
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

    // ✅ Usar ID de la ruta, no de una propiedad inexistente
    const employeeId = this.route.snapshot.params['id'];

    // Enviar datos actualizados al servidor
    this.employeeServices.updateEmployee(employeeId, cleanEmployee).subscribe({
      next: (data) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Empleado actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        // Regresar a la lista de propietarios
        this.router.navigate(['/dashboards/employee/list'])

      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  goBack() {
    this.router.navigate(['/dashboards/employee/list'])
  }
}
