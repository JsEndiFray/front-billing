import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {ActivatedRoute, Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {EstatesValidatorService} from '../../../core/services/validator-services/estates-validator.service';


@Component({
  selector: 'app-estates-edit',
  imports: [
    FormsModule,
  ],
  templateUrl: './estates-edit.component.html',
  styleUrl: './estates-edit.component.css'
})
export class EstatesEditComponent implements OnInit {

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
  // Guardar la referencia catastral original para comparar
  originalCadastralReference: string = '';

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private route: ActivatedRoute,
    private estateValidatorServices: EstatesValidatorService,
  ) {
  }

  ngOnInit(): void {
    // Obtener el ID de la URL
    this.route.params.subscribe(params => {
      const id = params['id']; // Convertir a número
      if (id) {
        // Cargo los campos del inmueble
        this.estateService.getById(id).subscribe({
          next: (estates) => {
            this.estate = estates;
            // Guardar la referencia catastral
            this.originalCadastralReference = this.estate.cadastral_reference;
          },
          error: (e: HttpErrorResponse) => {
          }
        });
      }
    });
  }

  updateEstate() {
    //verifica id
    if (this.estate.id === null || this.estate.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID de inmueble no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //Limpiar y transformar datos
    const cleanEstate = this.estateValidatorServices.cleanEstatesData(this.estate)

    // Validar campos requeridos
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
    //acceso al backend
    this.estateService.updateEstate(this.estate.id, cleanEstate).subscribe({
      next: (data: Estates) => {
        this.estate = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Inmueble actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.router.navigate(['/dashboard/estates/list']);
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }
  goBack(){
    this.router.navigate(['/dashboard/estates/list']);
  }


}
