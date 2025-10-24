import {Directive} from '@angular/core';
import {ExportService} from '../../core/services/shared-services/exportar.service';
import {ExportColumn} from '../../interfaces/exportar-interface';
import {PaginationConfig} from '../../interfaces/pagination-interface';
import Swal from 'sweetalert2';

@Directive()
export abstract class ExportableListBase<T extends { id?: number | null }> {
  //                                              ⬆️ Cualquier tipo que tenga id

  // Propiedades que DEBE proveer el componente hijo
  abstract exportService: ExportService;
  abstract selectedItems: Set<number>;
  abstract getFilteredData(): T[];
  abstract getCurrentPageData(): T[];
  abstract getPaginationConfig(): PaginationConfig;
  abstract exportColumns: ExportColumn[];
  abstract entityName: string;

  /**
   * Exporta todos los datos filtrados
   */
  exportData(): void {
    this.exportService.exportData({
      data: this.getFilteredData(),
      filename: this.entityName,
      title: `Listado de ${this.capitalizeFirst(this.entityName)}`,
      columns: this.exportColumns
    });
  }

  /**
   * Exporta solo la página actual
   */
  exportCurrentPage(): void {
    this.exportService.exportData({
      data: this.getCurrentPageData(),
      filename: `${this.entityName}-pagina`,
      title: `${this.capitalizeFirst(this.entityName)} - Página ${this.getPaginationConfig().currentPage}`,
      columns: this.exportColumns
    });
  }

  /**
   * Exporta solo los elementos seleccionados
   */
  exportSelected(): void {
    const selectedData = this.getFilteredData().filter((item: T) =>
      item.id != null && this.selectedItems.has(item.id)
    );

    if (selectedData.length === 0) {
      Swal.fire('Sin selección', 'Selecciona al menos un registro', 'warning');
      return;
    }

    this.exportService.exportData({
      data: selectedData,
      filename: `${this.entityName}-seleccionados`,
      title: `${this.capitalizeFirst(this.entityName)} Seleccionados (${selectedData.length})`,
      columns: this.exportColumns
    });
  }

  /**
   * Alterna la selección de un elemento
   */
  toggleSelection(id: number): void {
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
  }

  /**
   * Selecciona/deselecciona todos los de la página actual
   */
  toggleAllSelection(): void {
    const currentPage = this.getCurrentPageData();
    const allSelected = currentPage.every((item: T) =>
      item.id != null && this.selectedItems.has(item.id)
    );

    if (allSelected) {
      currentPage.forEach((item: T) => {
        if (item.id != null) {
          this.selectedItems.delete(item.id);
        }
      });
    } else {
      currentPage.forEach((item: T) => {
        if (item.id != null) {
          this.selectedItems.add(item.id);
        }
      });
    }
  }

  /**
   * Verifica si todos los elementos de la página actual están seleccionados
   */
  isAllSelected(): boolean {
    const currentPage = this.getCurrentPageData();
    return currentPage.length > 0 &&
      currentPage.every((item: T) =>
        item.id != null && this.selectedItems.has(item.id)
      );
  }

  /**
   * Capitaliza la primera letra de un string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
