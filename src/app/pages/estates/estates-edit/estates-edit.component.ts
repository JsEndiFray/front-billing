import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstateEdit, Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {ActivatedRoute, Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';

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
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    // Obtener el ID de la URL
    this.route.params.subscribe(params => {
      const id = params['id']; // Convertir a número
      if (id) {
        // Cargo los campos del inmueble
        this.estateService.getById(id).subscribe({
          next: (response: EstateEdit) => {
            // Verificar la estructura y extraer los datos
            if (response && response.data) {
              // Si viene dentro de data.result
              this.estate = response.data;
            }
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
    if (this.estate.id === null || this.estate.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID de inmueble no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //validacion de duplicado referencia catastral
    if (this.estate.cadastral_reference !== this.originalCadastralReference) {
      Swal.fire({
        title: 'Error',
        text: 'Ya ha sido registrada esa referencia catastral.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
    this.estateService.updateEstate(this.estate.id, this.estate).subscribe({
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


}
