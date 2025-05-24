import {Component, OnInit} from '@angular/core';
import {EstateArray, Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';


@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [FormsModule, DataFormatPipe
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent implements OnInit {
  //para monstrar el listado
  estates: Estates[] = [];

  constructor(
    private estateService: EstatesService,
    private router: Router,) {
  }

  ngOnInit(): void {
    this.getListEstate();
  }

  //recargar la lista
  loadEstates() {
    this.estateService.getAllEstate().subscribe({
      next: (response) => {
        this.estates = response.data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  //ruta para editar (boton)
  editEstate(id: number) {
    this.router.navigate(['/dashboard/estates/edit', id]);

  }

  //ruta para eliminar (boton)
  deleteEstate(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.estateService.deleteEstate(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Inmueble eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadEstates();
          },
          error: (e: HttpErrorResponse) => {
          }
        })

      }
    })


  }

  //conexión DB
  //Listado de los inmuebles
  getListEstate() {
    this.estateService.getAllEstate().subscribe({
      next: (response: EstateArray) => {
        this.estates = response.data;
      }, error: (e: HttpErrorResponse) => {
      }
    });
  }
}
