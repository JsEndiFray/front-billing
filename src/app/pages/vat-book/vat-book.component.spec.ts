import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';

import { VatBookComponent } from './vat-book.component';
import { VatBookService } from '../../core/services/vat-services/vat-book.service';
import { VatBookUtilsHelper } from '../../core/helpers/vat-book-utils.helper';
import { ExportService } from '../../core/services/shared-services/exportar.service';
import { ConsolidatedVATBook, VATBookEntry } from '../../interfaces/vat-book-interface';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(numeroFactura: string, nombreProveedor: string): VATBookEntry {
  return {
    numeroFactura,
    fechaFactura: '2024-01-15',
    nombreProveedor,
    nifProveedor: 'B12345678',
    baseImponible: 100,
    tipoIVA: 21,
    cuotaIVA: 21,
    totalFactura: 121
  };
}

function makeVatData(supported: VATBookEntry[] = [], charged: VATBookEntry[] = []): ConsolidatedVATBook {
  return {
    supported,
    charged,
    summaryByOwner: []
  } as unknown as ConsolidatedVATBook;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('VatBookComponent', () => {
  let component: VatBookComponent;
  let fixture: ComponentFixture<VatBookComponent>;

  // Writable signals — owned by the test so we can push data into the component
  let vatDataSignal: ReturnType<typeof signal<ConsolidatedVATBook | null>>;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal:   ReturnType<typeof signal<string | null>>;

  let vatBookServiceMock: jasmine.SpyObj<VatBookService>;
  let vatBookUtilsSpy:    jasmine.SpyObj<VatBookUtilsHelper>;
  let exportServiceSpy:   jasmine.SpyObj<ExportService>;

  beforeEach(async () => {
    // Create signals that the component's computed() calls will track
    vatDataSignal = signal<ConsolidatedVATBook | null>(null);
    loadingSignal = signal<boolean>(false);
    errorSignal   = signal<string | null>(null);

    // Service mock exposes the real signals so Angular's reactive graph works
    vatBookServiceMock = {
      vatData:             vatDataSignal,
      loading:             loadingSignal,
      error:               errorSignal,
      getConsolidatedBook: jasmine.createSpy('getConsolidatedBook')
    } as unknown as jasmine.SpyObj<VatBookService>;

    // Helper spy — methods are called during class-field init AND in computed()
    vatBookUtilsSpy = jasmine.createSpyObj<VatBookUtilsHelper>('VatBookUtilsHelper', [
      'getAvailableYears',
      'getQuarters',
      'getMonths',
      'filterBySearch',
      'calculateBookStats',
      'getPeriodLabel',
      'formatAmount',
      'formatDate',
      'truncateText',
      'getVatRateClass',
      'getVatRateLabel',
      'getDeductibleClass',
      'getDeductibleLabel',
      'getNetVATClass',
      'getNetVATLabel'
    ]);

    // Default return values needed at construction time
    vatBookUtilsSpy.getAvailableYears.and.returnValue([2026, 2025, 2024]);
    vatBookUtilsSpy.getQuarters.and.returnValue([
      { value: null, label: 'Todo el año' },
      { value: 1, label: 'T1' }, { value: 2, label: 'T2' },
      { value: 3, label: 'T3' }, { value: 4, label: 'T4' }
    ]);
    vatBookUtilsSpy.getMonths.and.returnValue([
      { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }
    ]);
    vatBookUtilsSpy.filterBySearch.and.callFake(
      (entries: VATBookEntry[], _search: string) => entries
    );
    vatBookUtilsSpy.calculateBookStats.and.returnValue({
      totalEntries: 0, totalBase: 0, totalVAT: 0,
      totalInvoices: 0, averageVAT: 0, byVATRate: {}
    });
    vatBookUtilsSpy.getPeriodLabel.and.returnValue('Año 2026');

    exportServiceSpy = jasmine.createSpyObj<ExportService>('ExportService', ['exportData']);

    await TestBed.configureTestingModule({
      imports:   [VatBookComponent],
      providers: [
        { provide: VatBookService,    useValue: vatBookServiceMock },
        { provide: VatBookUtilsHelper, useValue: vatBookUtilsSpy   },
        { provide: ExportService,     useValue: exportServiceSpy   }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(VatBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── filteredSupported ────────────────────────────────────────────────────

  describe('filteredSupported (computed)', () => {
    it('should return empty array when vatData is null', () => {
      vatDataSignal.set(null);
      fixture.detectChanges();

      expect(component.filteredSupported()).toEqual([]);
    });

    it('should return all entries when searchText is empty', () => {
      const entries = [makeEntry('F-001', 'Proveedor A'), makeEntry('F-002', 'Proveedor B')];
      vatBookUtilsSpy.filterBySearch.and.callFake(
        (e: VATBookEntry[], _s: string) => e
      );
      vatDataSignal.set(makeVatData(entries));
      fixture.detectChanges();

      expect(component.filteredSupported().length).toBe(2);
    });

    it('should update reactively when searchText changes via patchValue', () => {
      const all      = [makeEntry('F-001', 'Alpha'), makeEntry('F-002', 'Beta')];
      const filtered = [makeEntry('F-001', 'Alpha')];

      vatDataSignal.set(makeVatData(all));
      fixture.detectChanges();

      // Simulate search — spy returns filtered set on next call
      vatBookUtilsSpy.filterBySearch.and.callFake(
        (_entries: VATBookEntry[], search: string) =>
          search ? filtered : all
      );

      // patchValue emits valueChanges → toSignal updates → computed recalculates
      component.filtersForm.patchValue({ searchText: 'Alpha' });
      fixture.detectChanges();

      expect(vatBookUtilsSpy.filterBySearch).toHaveBeenCalledWith(all, 'Alpha');
    });

    it('should pass searchText from formValues to filterBySearch', () => {
      const entries = [makeEntry('F-001', 'Proveedor')];
      vatDataSignal.set(makeVatData(entries));

      component.filtersForm.patchValue({ searchText: 'test' });
      fixture.detectChanges();

      const calls = vatBookUtilsSpy.filterBySearch.calls.mostRecent();
      expect(calls.args[1]).toBe('test');
    });
  });

  // ─── showMonthSelector (computed) ────────────────────────────────────────

  describe('showMonthSelector (computed)', () => {
    it('should be TRUE when quarter is null (no quarter selected)', () => {
      component.filtersForm.patchValue({ quarter: null });
      fixture.detectChanges();

      expect(component.showMonthSelector()).toBeTrue();
    });

    it('should be FALSE when a quarter is selected', () => {
      component.filtersForm.patchValue({ quarter: 2 });
      fixture.detectChanges();

      expect(component.showMonthSelector()).toBeFalse();
    });

    it('should react when quarter changes from a value back to null', () => {
      component.filtersForm.patchValue({ quarter: 1 });
      fixture.detectChanges();
      expect(component.showMonthSelector()).toBeFalse();

      component.filtersForm.patchValue({ quarter: null });
      fixture.detectChanges();
      expect(component.showMonthSelector()).toBeTrue();
    });
  });

  // ─── periodLabel (computed) ───────────────────────────────────────────────

  describe('periodLabel (computed)', () => {
    it('should call getPeriodLabel with current year when no quarter/month set', () => {
      const currentYear = new Date().getFullYear();
      vatBookUtilsSpy.getPeriodLabel.and.returnValue(`Año ${currentYear}`);

      component.filtersForm.patchValue({ year: currentYear, quarter: null, month: null });
      fixture.detectChanges();

      const label = component.periodLabel();

      expect(vatBookUtilsSpy.getPeriodLabel).toHaveBeenCalledWith(
        currentYear, undefined, undefined
      );
      expect(label).toBe(`Año ${currentYear}`);
    });

    it('should pass quarter to getPeriodLabel (null converted to undefined)', () => {
      vatBookUtilsSpy.getPeriodLabel.and.returnValue('T2 2025');

      component.filtersForm.patchValue({ year: 2025, quarter: 2, month: null });
      fixture.detectChanges();
      component.periodLabel();

      expect(vatBookUtilsSpy.getPeriodLabel).toHaveBeenCalledWith(2025, 2, undefined);
    });

    it('should pass month to getPeriodLabel (null converted to undefined)', () => {
      vatBookUtilsSpy.getPeriodLabel.and.returnValue('Marzo 2025');

      component.filtersForm.patchValue({ year: 2025, quarter: null, month: 3 });
      fixture.detectChanges();
      component.periodLabel();

      expect(vatBookUtilsSpy.getPeriodLabel).toHaveBeenCalledWith(2025, undefined, 3);
    });

    it('should update reactively when year changes', () => {
      vatBookUtilsSpy.getPeriodLabel.and.returnValue('Año 2023');

      component.filtersForm.patchValue({ year: 2023 });
      fixture.detectChanges();

      expect(component.periodLabel()).toBe('Año 2023');
    });
  });

  // ─── activeTab (signal) ───────────────────────────────────────────────────

  describe('setActiveTab()', () => {
    it('should update the activeTab signal', () => {
      component.setActiveTab(1);
      expect(component.activeTab()).toBe(1);
    });

    it('should reset searchText to empty string', () => {
      component.filtersForm.patchValue({ searchText: 'something' });
      component.setActiveTab(0);
      fixture.detectChanges();

      expect(component.filtersForm.get('searchText')?.value).toBe('');
    });
  });

  // ─── loadData() ───────────────────────────────────────────────────────────

  describe('loadData()', () => {
    it('should call getConsolidatedBook with year from form on init', () => {
      const currentYear = new Date().getFullYear();
      expect(vatBookServiceMock.getConsolidatedBook).toHaveBeenCalledWith(
        currentYear, undefined, undefined
      );
    });

    it('should call getConsolidatedBook with form values when called manually', () => {
      component.filtersForm.patchValue({ year: 2024, quarter: 3, month: null });
      component.loadData();

      expect(vatBookServiceMock.getConsolidatedBook).toHaveBeenCalledWith(
        2024, 3, undefined
      );
    });
  });

  // ─── loading / error passthrough ─────────────────────────────────────────

  describe('loading and error state', () => {
    it('should reflect loading signal from service', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      expect(component.loading()).toBeTrue();

      loadingSignal.set(false);
      fixture.detectChanges();
      expect(component.loading()).toBeFalse();
    });

    it('should reflect error signal from service', () => {
      errorSignal.set('Network error');
      fixture.detectChanges();
      expect(component.error()).toBe('Network error');
    });
  });
});
