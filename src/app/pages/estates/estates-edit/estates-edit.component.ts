import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Estates} from '../../../interfaces/estates-interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {ActivatedRoute, Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para editar propiedades inmobiliarias existentes
 * Permite modificar datos de inmuebles con validaciones específicas
 */
@Component({
  selector: 'app-estates-edit',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './estates-edit.component.html',
  styleUrl: './estates-edit.component.css'
})
export class EstatesEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================
  estateForm: FormGroup;

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private route: ActivatedRoute,
    private validatorService: ValidatorService,
    private fb: FormBuilder
  ) {
    this.estateForm = this.fb.group({
      id: [null],
      cadastral_reference: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(20)]],
      price: [null, [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required]],
      postal_code: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      location: ['', [Validators.required]],
      province: ['', [Validators.required]],
      country: ['España', [Validators.required]],
      surface: [null, [Validators.required, Validators.min(1)]],
    })
  }

  /**
   * Se ejecuta al cargar el componente
   * Busca la propiedad que se quiere editar
   */
  ngOnInit(): void {
    // Sacar el ID de la URL (ejemplo: /edit/123)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Buscar los datos de la propiedad por su ID
        this.estateService.getById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.estateForm.patchValue(data[0]);//carga valores en el FormGroup
            }
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  /**
   * Actualiza los datos de la propiedad
   * Valida información antes de enviar al servidor
   */
  async updateEstate() {
    // Verificar que la propiedad tenga ID válido
    if(!this.estateForm.valid){
      Swal.fire({
        title: 'Error!',
        text: 'Formulario inválido, corrige los errores',
        icon: 'error'
      });
      return;
    }

    // Transformar datos (aplica mayúsculas, limpia espacios, etc.)
    this.validatorService.applyTransformations(this.estateForm, 'estate');

    const estateData = this.estateForm.value;

    // Validar que todos los campos estén correctos
    const validation = await this.validatorService.validateEstate(estateData)
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
    this.estateService.updateEstate(estateData.id, estateData).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.estateForm.patchValue(data[0]);//actualizar valores
          Swal.fire({
            title: '¡Éxito!',
            text: 'Inmueble actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          // Regresar a la lista de propiedades
          this.router.navigate(['/dashboards/estates/list']);
        }

      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Cancelar edición y regresar a la lista
   */
  goBack() {
    this.router.navigate(['/dashboards/estates/list']);
  }
}
