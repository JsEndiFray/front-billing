import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {ActivatedRoute, Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {EstatesValidatorService} from '../../../core/services/validator-services/estates-validator.service';

/**
 * Componente para editar propiedades inmobiliarias existentes
 * Permite modificar datos de inmuebles con validaciones específicas
 */
@Component({
  selector: 'app-estates-edit',
  imports: [
    FormsModule,
  ],
  templateUrl: './estates-edit.component.html',
  styleUrl: './estates-edit.component.css'
})
export class EstatesEditComponent implements OnInit {

  // Objeto que guarda todos los datos de la propiedad
  estate: Estates = {
    id: null,
    cadastral_reference: '',
    price: null,
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: '',
    surface: null
  }

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private route: ActivatedRoute,
    private estateValidatorServices: EstatesValidatorService,
  ) {}

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
          next: (estates) => {
            this.estate = estates; // Cargar los datos en el formulario
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
  updateEstate() {
    // Verificar que la propiedad tenga ID válido
    if (this.estate.id === null || this.estate.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID de inmueble no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar espacios y preparar datos
    const cleanEstate = this.estateValidatorServices.cleanEstatesData(this.estate)

    // Validar que todos los campos estén correctos
    const validation = this.estateValidatorServices.validateEstate(cleanEstate)
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
    this.estateService.updateEstate(this.estate.id, cleanEstate).subscribe({
      next: (data: Estates) => {
        this.estate = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Inmueble actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        // Regresar a la lista de propiedades
        this.router.navigate(['/dashboard/estates/list']);
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Cancelar edición y regresar a la lista
   */
  goBack(){
    this.router.navigate(['/dashboard/estates/list']);
  }
}
