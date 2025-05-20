import {Component, OnInit} from '@angular/core';
import {EstateArray, Estates} from '../../../interface/estates.interface';
import {EstateService} from '../../../core/services/estate-services/estate.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [FormsModule
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent implements OnInit {
  //para monstrar el listado
  estates: Estates[] = [];

  constructor(
    private estateService: EstateService,
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

  //ruta para editar
  editEstate(id: number) {
    this.router.navigate(['/dashboard/estates/edit', id]);

  }

  //ruta para eliminar
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

  //formatea la fecha local
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

}
