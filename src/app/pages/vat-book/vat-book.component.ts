import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VatBookUtilsHelper } from '../../core/helpers/vat-book-utils.helper';
import { ExportService } from '../../core/services/shared-services/exportar.service';
import { ExportColumn } from '../../interfaces/exportar-interface';
import { VatBookService } from '../../core/services/vat-services/vat-book.service';

@Component({
  selector: 'app-vat-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vat-book.component.html',
  styleUrl: './vat-book.component.css'
})
export class VatBookComponent {

  // ── Servicios ─────────────────────────────────────────────────────────────
  private readonly vatBookService = inject(VatBookService);
  private readonly fb             = inject(FormBuilder);
  readonly vatBookUtils           = inject(VatBookUtilsHelper);
  readonly exportService          = inject(ExportService);

  // ── Formulario ────────────────────────────────────────────────────────────
  // Inicializado como class field para que formValues pueda depender de él
  readonly filtersForm = this.fb.group({
    year:       [new Date().getFullYear(), Validators.required],
    quarter:    [null as number | null],
    month:      [null as number | null],
    searchText: ['']
  });

  // ── Bridge FormGroup → Signal ─────────────────────────────────────────────
  // toSignal suscribe a valueChanges y expone el valor actual como signal.
  // initialValue evita el tipo `| undefined` y garantiza valor desde el primer render.
  private readonly formValues = toSignal(this.filtersForm.valueChanges, {
    initialValue: this.filtersForm.value
  });

  // ── Estado UI ─────────────────────────────────────────────────────────────
  activeTab = signal<number>(0);

  // ── Signals del servicio (referencias directas — sin computed redundante) ──
  // El servicio expone Signal<T> readonly: asignar la referencia es equivalente
  // a computed(() => service.x()) pero sin crear un nodo extra en el grafo reactivo.
  readonly vatData = this.vatBookService.vatData;
  readonly loading = this.vatBookService.loading;
  readonly error   = this.vatBookService.error;

  // ── Computed reactivos ────────────────────────────────────────────────────

  filteredSupported = computed(() => {
    const data       = this.vatData()?.supported || [];
    const searchText = this.formValues().searchText || '';
    return this.vatBookUtils.filterBySearch(data, searchText);
  });

  filteredCharged = computed(() => {
    const data       = this.vatData()?.charged || [];
    const searchText = this.formValues().searchText || '';
    return this.vatBookUtils.filterBySearch(data, searchText);
  });

  filteredOwners = computed(() => {
    const data   = this.vatData()?.summaryByOwner || [];
    const search = (this.formValues().searchText || '').toLowerCase().trim();
    if (!search) return data;
    return data.filter(owner => owner.owner_name?.toLowerCase().includes(search));
  });

  currentTabData = computed(() => {
    switch (this.activeTab()) {
      case 0:  return this.filteredSupported();
      case 1:  return this.filteredCharged();
      default: return [];
    }
  });

  currentStats = computed(() => this.vatBookUtils.calculateBookStats(this.currentTabData()));

  periodLabel = computed(() => {
    const { year, quarter, month } = this.formValues();
    // year tiene Validators.required → nunca es null/undefined en runtime
    // quarter/month son opcionales: null (sin selección) se convierte a undefined
    return this.vatBookUtils.getPeriodLabel(year!, quarter ?? undefined, month ?? undefined);
  });

  showMonthSelector = computed(() => {
    const { quarter } = this.formValues();
    return quarter === null || quarter === undefined;
  });

  // ── Opciones para selectores ──────────────────────────────────────────────
  readonly availableYears = this.vatBookUtils.getAvailableYears();
  readonly quarters       = this.vatBookUtils.getQuarters();
  readonly months         = this.vatBookUtils.getMonths();

  // ── Columnas de exportación ───────────────────────────────────────────────
  readonly exportColumns: ExportColumn[] = [
    { key: 'numeroFactura',   title: 'Nº Factura' },
    { key: 'fechaFactura',    title: 'Fecha' },
    { key: 'nombreProveedor', title: 'Proveedor' },
    { key: 'nombreCliente',   title: 'Cliente' },
    { key: 'nifProveedor',    title: 'NIF Proveedor' },
    { key: 'nifCliente',      title: 'NIF Cliente' },
    { key: 'baseImponible',   title: 'Base Imponible' },
    { key: 'tipoIVA',         title: 'Tipo IVA (%)' },
    { key: 'cuotaIVA',        title: 'Cuota IVA' },
    { key: 'importeTotal',    title: 'Total' }
  ];

  readonly exportColumnsOwners: ExportColumn[] = [
    { key: 'owner_name',        title: 'Propietario' },
    { key: 'ownership_percent', title: '% Propiedad' },
    { key: 'vat_charged',       title: 'IVA Repercutido' },
    { key: 'vat_supported',     title: 'IVA Soportado' },
    { key: 'net_vat',           title: 'IVA Neto' }
  ];

  constructor() {
    this.loadData();
  }

  // ── Acciones principales ──────────────────────────────────────────────────

  loadData(): void {
    const { year, quarter, month } = this.filtersForm.value;
    this.vatBookService.getConsolidatedBook(year!, quarter ?? undefined, month ?? undefined);
  }

  applyFilters(): void {
    if (this.filtersForm.get('quarter')?.value !== null) {
      // emitEvent: true (por defecto) para que formValues reciba el valor actualizado
      this.filtersForm.patchValue({ month: null });
    }
    this.loadData();
  }

  onQuarterChange(): void {
    const quarter = this.filtersForm.get('quarter')?.value;
    if (quarter !== null && quarter !== undefined) {
      // emitEvent: true para que formValues y showMonthSelector reaccionen
      this.filtersForm.patchValue({ month: null });
    }
  }

  resetFilters(): void {
    this.filtersForm.reset({
      year:       new Date().getFullYear(),
      quarter:    null,
      month:      null,
      searchText: ''
    });
    this.loadData();
  }

  setActiveTab(tabIndex: number): void {
    this.activeTab.set(tabIndex);
    // emitEvent: true para que formValues actualice searchText y los computed reaccionen
    this.filtersForm.patchValue({ searchText: '' });
  }

  // ── Exportación ───────────────────────────────────────────────────────────

  exportCurrentTab(): void {
    const tabNames       = ['Soportado', 'Repercutido', 'Propietarios'];
    const currentTabName = tabNames[this.activeTab()];
    const period         = this.periodLabel().replace(/\s+/g, '-');

    if (this.activeTab() === 2) {
      this.exportService.exportData({
        data:     this.filteredOwners(),
        filename: `IVA-${currentTabName}-${period}`,
        title:    `Libro IVA - ${currentTabName}`,
        columns:  this.exportColumnsOwners
      });
    } else {
      this.exportService.exportData({
        data:     this.currentTabData(),
        filename: `IVA-${currentTabName}-${period}`,
        title:    `Libro IVA - ${currentTabName}`,
        columns:  this.exportColumns
      });
    }
  }

  exportAllTabs(): void {
    this.exportService.exportData({
      data:     this.filteredSupported(),
      filename: `libro-iva-completo-${this.periodLabel()}`,
      title:    `Libro de IVA Completo - ${this.periodLabel()}`,
      columns:  this.exportColumns
    });
  }

  // ── Helpers para el template ──────────────────────────────────────────────

  formatAmount(amount: unknown): string {
    return this.vatBookUtils.formatAmount(amount);
  }

  formatDate(date: unknown): string {
    return this.vatBookUtils.formatDate(date);
  }

  getVatRateClass(rate: number | undefined): string {
    return this.vatBookUtils.getVatRateClass(rate);
  }

  getVatRateLabel(rate: number | undefined): string {
    return this.vatBookUtils.getVatRateLabel(rate);
  }

  getDeductibleClass(isDeductible: boolean | undefined): string {
    return this.vatBookUtils.getDeductibleClass(isDeductible);
  }

  getDeductibleLabel(isDeductible: boolean | undefined): string {
    return this.vatBookUtils.getDeductibleLabel(isDeductible);
  }

  getNetVATClass(netVAT: number): string {
    return this.vatBookUtils.getNetVATClass(netVAT);
  }

  getNetVATLabel(netVAT: number): string {
    return this.vatBookUtils.getNetVATLabel(netVAT);
  }

  truncateText(text: unknown, maxLength: number = 30): string {
    return this.vatBookUtils.truncateText(text, maxLength);
  }
}
