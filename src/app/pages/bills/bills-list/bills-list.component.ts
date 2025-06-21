import {Component, OnInit} from '@angular/core';
import {Bill} from '../../../interface/bills-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {BillsService} from '../../../core/services/bills-services/bills.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';
import {SearchService} from '../../../core/services/search-services/search.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

/**
 * Componente para mostrar y gestionar la lista de facturas
 * Permite buscar, crear, editar, eliminar y descargar facturas en PDF
 */
@Component({
  selector: 'app-bills-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: './bills-list.component.html',
  styleUrl: './bills-list.component.css'
})
export class BillsListComponent implements OnInit {

  // Lista de facturas que se muestra en la tabla
  bills: Bill[] = [];

  // Lista completa de facturas (datos originales sin filtrar)
  allBills: Bill[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private billsServices: BillsService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de facturas automáticamente
   */
  ngOnInit(): void {
    this.getListBills();
  }

  /**
   * Obtiene todas las facturas del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListBills() {
    this.billsServices.getAllBills().subscribe({
      next: (data) => {
        this.bills = data;        // Lista que se muestra
        this.allBills = data;     // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Filtra la lista de facturas según el texto de búsqueda
   * Busca en: número de factura, ID de propiedad, ID de cliente, ID de propietario
   */
  filterBills() {
    this.bills = this.searchService.filterData(
      this.allBills,
      this.searchTerm,
      ['bill_number', 'estates_id', 'clients_id', 'owners_id']
    )
  }

  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterBills();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterBills();
  }

  /**
   * Navega a la página de registro de nueva factura
   */
  createNewBill() {
    this.router.navigate(['/dashboard/bills/register']);
  }

  /**
   * Navega a la página de edición de factura
   */
  editBill(id: number) {
    this.router.navigate(['/dashboard/bills/edit', id]);
  }

  /**
   * Elimina una factura después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteBill(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Usuario confirmó, proceder a eliminar
        this.billsServices.deleteBills(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'La factura fue eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListBills();
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  /**
   * Descarga una factura en formato PDF
   * Muestra indicador de carga y maneja la descarga automática del archivo
   */
  downloadPDF(billId: number) {
    // Mostrar indicador de carga mientras se genera el PDF
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Solicitar el PDF al servidor
    this.billsServices.downloadPDF(billId).subscribe({
      next: (pdfBlob) => {
        Swal.close();

        // Verificar que el archivo PDF no esté vacío
        if (pdfBlob.size === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Archivo vacío',
            text: 'El PDF generado está vacío'
          });
          return;
        }

        // Crear URL temporal para el archivo PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura-${billId}.pdf`;

        // Descargar el archivo de forma invisible (sin agregar al DOM)
        link.style.display = 'none';
        link.click();

        // Limpiar la URL temporal después de un momento
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);

        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Descarga exitosa!',
          text: `Factura ${billId} descargada`,
          timer: 2000,
          showConfirmButton: false
        });

      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
        Swal.close();
      }
    })
  }
}
