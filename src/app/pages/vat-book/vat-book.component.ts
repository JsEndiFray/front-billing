import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VatBookUtilsHelper } from '../../core/helpers/vat-book-utils.helper';
import { ExportService } from '../../core/services/shared-services/exportar.service';
import { ExportColumn } from '../../interfaces/exportar-interface';
import {VatBookService} from '../../core/services/vat-services/vat-book.service';

/**
 * Componente para el Libro de IVA
 * Muestra IVA Soportado, Repercutido y Resumen por Propietario
 */
@Component({
  selector: 'app-vat-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vat-book.component.html',
  styleUrl: './vat-book.component.css'
})
export class VatBookComponent {

  // Servicios y helpers
  private vatBookService = inject(VatBookService);
  private fb = inject(FormBuilder);
  vatBookUtils = inject(VatBookUtilsHelper);
  exportService = inject(ExportService);

  // ==========================================================
  // FORMGROUP PARA FILTROS
  // ==========================================================

  filtersForm!: FormGroup;

  // ==========================================================
  // SIGNALS PARA ESTADO
  // ==========================================================

  // Tab activo (0 = Soportado, 1 = Repercutido, 2 = Por Propietario)
  activeTab = signal<number>(0);

  // ==========================================================
  // COMPUTED SIGNALS (Datos reactivos)
  // ==========================================================

  // Datos del servicio
  vatData = computed(() => this.vatBookService.vatData());
  loading = computed(() => this.vatBookService.loading());
  error = computed(() => this.vatBookService.error());

  // Entradas filtradas por búsqueda según tab activo
  filteredSupported = computed(() => {
    const data = this.vatData()?.supported || [];
    const searchText = this.filtersForm.get('searchText')?.value || '';
    return this.vatBookUtils.filterBySearch(data, searchText);
  });

  filteredCharged = computed(() => {
    const data = this.vatData()?.charged || [];
    const searchText = this.filtersForm.get('searchText')?.value || '';
    return this.vatBookUtils.filterBySearch(data, searchText);
  });

  filteredOwners = computed(() => {
    const data = this.vatData()?.summaryByOwner || [];
    const searchText = this.filtersForm.get('searchText')?.value || '';
    const search = searchText.toLowerCase().trim();

    if (!search) return data;

    return data.filter(owner =>
      owner.owner_name?.toLowerCase().includes(search)
    );
  });

  // Datos actuales según el tab activo
  currentTabData = computed(() => {
    switch (this.activeTab()) {
      case 0:
        return this.filteredSupported();
      case 1:
        return this.filteredCharged();
      default:
        return [];
    }
  });

  // Label del período actual
  periodLabel = computed(() => {
    const year = this.filtersForm.get('year')?.value;
    const quarter = this.filtersForm.get('quarter')?.value;
    const month = this.filtersForm.get('month')?.value;

    return this.vatBookUtils.getPeriodLabel(year, quarter, month);
  });

  // Estadísticas del tab activo
  currentStats = computed(() => {
    const data = this.currentTabData();
    return this.vatBookUtils.calculateBookStats(data);
  });

  // Mostrar selector de mes solo si NO hay trimestre seleccionado
  showMonthSelector = computed(() => {
    const quarter = this.filtersForm.get('quarter')?.value;
    return quarter === null || quarter === undefined;
  });

  // ==========================================================
  // OPCIONES PARA SELECTORES
  // ==========================================================

  availableYears = this.vatBookUtils.getAvailableYears();
  quarters = this.vatBookUtils.getQuarters();
  months = this.vatBookUtils.getMonths();

  // ==========================================================
  // CONSTRUCTOR - Cargar datos iniciales
  // ==========================================================

  constructor() {
    // Inicializar FormGroup
    this.filtersForm = this.fb.group({
      year: [new Date().getFullYear(), Validators.required],
      quarter: [null as number | null],
      month: [null as number | null],
      searchText: ['']
    });

    this.loadData();
  }

  // ==========================================================
  // CONFIGURACIÓN PARA EXPORTACIÓN
  // ==========================================================

  exportColumns: ExportColumn[] = [
    { key: 'numeroFactura', title: 'Nº Factura' },
    { key: 'fechaFactura', title: 'Fecha' },
    { key: 'nombreProveedor', title: 'Proveedor' },
    { key: 'nombreCliente', title: 'Cliente' },
    { key: 'nifProveedor', title: 'NIF Proveedor' },
    { key: 'nifCliente', title: 'NIF Cliente' },
    { key: 'baseImponible', title: 'Base Imponible' },
    { key: 'tipoIVA', title: 'Tipo IVA (%)' },
    { key: 'cuotaIVA', title: 'Cuota IVA' },
    { key: 'importeTotal', title: 'Total' }
  ];

  exportColumnsOwners: ExportColumn[] = [
    { key: 'owner_name', title: 'Propietario' },
    { key: 'ownership_percent', title: '% Propiedad' },
    { key: 'vat_charged', title: 'IVA Repercutido' },
    { key: 'vat_supported', title: 'IVA Soportado' },
    { key: 'net_vat', title: 'IVA Neto' }
  ];

  // ==========================================================
  // MÉTODOS REQUERIDOS POR ExportableListBase
  // ==========================================================
  // ==========================================================
  // ACCIONES PRINCIPALES
  // ==========================================================

  /**
   * Carga los datos del libro de IVA
   */
  loadData(): void {
    const year = this.filtersForm.get('year')?.value;
    const quarter = this.filtersForm.get('quarter')?.value;
    const month = this.filtersForm.get('month')?.value;

    this.vatBookService.getConsolidatedBook(year, quarter, month);
  }

  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    // Si selecciona trimestre, limpiar mes
    if (this.filtersForm.get('quarter')?.value !== null) {
      this.filtersForm.patchValue({ month: null }, { emitEvent: false });
    }

    this.loadData();
  }

  /**
   * Maneja el cambio de trimestre
   */
  onQuarterChange(): void {
    const quarter = this.filtersForm.get('quarter')?.value;

    // Si selecciona un trimestre, limpiar el mes
    if (quarter !== null && quarter !== undefined) {
      this.filtersForm.patchValue({ month: null }, { emitEvent: false });
    }
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.filtersForm.reset({
      year: new Date().getFullYear(),
      quarter: null,
      month: null,
      searchText: ''
    });
    this.loadData();
  }

  /**
   * Cambia el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab.set(tabIndex);
    this.filtersForm.patchValue({ searchText: '' }, { emitEvent: false });
  }

  // ==========================================================
  // EXPORTACIÓN PERSONALIZADA
  // ==========================================================

  /**
   * Exporta el tab activo
   */
  exportCurrentTab(): void {
    const tabNames = ['Soportado', 'Repercutido', 'Propietarios'];
    const currentTabName = tabNames[this.activeTab()];
    const period = this.periodLabel().replace(/\s+/g, '-'); // Quitar espacios

    if (this.activeTab() === 2) {
      // Exportar resumen por propietario
      this.exportService.exportData({
        data: this.filteredOwners(),
        filename: `IVA-${currentTabName}-${period}`,
        title: `Libro IVA - ${currentTabName}`,
        columns: this.exportColumnsOwners
      });
    } else {
      // Exportar soportado o repercutido
      this.exportService.exportData({
        data: this.currentTabData(),
        filename: `IVA-${currentTabName}-${period}`,
        title: `Libro IVA - ${currentTabName}`,
        columns: this.exportColumns
      });
    }
  }

  /**
   * Exporta todos los tabs en un solo archivo
   */
  exportAllTabs(): void {
    // Por ahora exporta el primero como ejemplo
    // Puedes extender para multi-sheet si tu ExportService lo soporta
    this.exportService.exportData({
      data: this.filteredSupported(),
      filename: `libro-iva-completo-${this.periodLabel()}`,
      title: `Libro de IVA Completo - ${this.periodLabel()}`,
      columns: this.exportColumns
    });
  }

 /* /!**
   * Descarga Excel desde el backend
   *!/
  downloadExcel(): void {
    const year = this.filtersForm.get('year')?.value;
    const quarter = this.filtersForm.get('quarter')?.value;
    const month = this.filtersForm.get('month')?.value;

    const bookType = this.activeTab() === 0 ? 'supported' :
      this.activeTab() === 1 ? 'charged' : 'both';

    this.vatBookService.downloadExcel(year, quarter, month, bookType);
  }

  /!**
   * Descarga PDF desde el backend
   *!/
  downloadPDF(): void {
    const year = this.filtersForm.get('year')?.value;
    const quarter = this.filtersForm.get('quarter')?.value;
    const month = this.filtersForm.get('month')?.value;

    const bookType = this.activeTab() === 0 ? 'supported' :
      this.activeTab() === 1 ? 'charged' : 'both';

    this.vatBookService.downloadPDF(year, quarter, month, bookType);
  }*/

  // ==========================================================
  // MÉTODOS AUXILIARES PARA EL HTML
  // ==========================================================

  /**
   * Formatea un monto
   */
  formatAmount(amount: unknown): string {
    return this.vatBookUtils.formatAmount(amount);
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: unknown): string {
    return this.vatBookUtils.formatDate(date);
  }

  /**
   * Obtiene la clase CSS para un tipo de IVA
   */
  getVatRateClass(rate: number | undefined): string {
    return this.vatBookUtils.getVatRateClass(rate);
  }

  /**
   * Obtiene el label para un tipo de IVA
   */
  getVatRateLabel(rate: number | undefined): string {
    return this.vatBookUtils.getVatRateLabel(rate);
  }

  /**
   * Obtiene clase CSS para deducible
   */
  getDeductibleClass(isDeductible: boolean | undefined): string {
    return this.vatBookUtils.getDeductibleClass(isDeductible);
  }

  /**
   * Obtiene label para deducible
   */
  getDeductibleLabel(isDeductible: boolean | undefined): string {
    return this.vatBookUtils.getDeductibleLabel(isDeductible);
  }

  /**
   * Obtiene clase CSS para IVA neto
   */
  getNetVATClass(netVAT: number): string {
    return this.vatBookUtils.getNetVATClass(netVAT);
  }

  /**
   * Obtiene label para IVA neto
   */
  getNetVATLabel(netVAT: number): string {
    return this.vatBookUtils.getNetVATLabel(netVAT);
  }

  /**
   * Trunca texto largo
   */
  truncateText(text: unknown, maxLength: number = 30): string {
    return this.vatBookUtils.truncateText(text, maxLength);
  }
}
