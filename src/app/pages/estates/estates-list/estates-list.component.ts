import {Component, OnInit} from '@angular/core';
import {Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../core/services/search-services/search.service';


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

  // Lista completa de clientes (datos originales)
  allStates: Estates[] = [];

  // Término de búsqueda
  searchTerm: string = '';

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
    this.getListEstate();
  }

  //Listado de los inmuebles
  getListEstate() {
    this.estateService.getAllEstate().subscribe({
      next: (estates) => {
        this.estates = estates;
        this.allStates = estates;
      }, error: (e: HttpErrorResponse) => {
      }
    });
  }

  //meto de flitros
  filterEstates() {
    this.estates = this.searchService.filterData(
      this.allStates,
      this.searchTerm,
      ['cadastral_reference', 'address', 'location', 'province']
    );
  }

  //Limpiar el término de búsqueda y mostrar todos los clientes
  clearSearch() {
    this.searchTerm = '';
    this.filterEstates();

  };

  onSearchChange() {
    this.filterEstates();
  };

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
            this.getListEstate();
          },
          error: (e: HttpErrorResponse) => {
          }
        })

      }
    })
  }

}
