import {Injectable} from '@angular/core';
import {Invoice} from '../../../interfaces/invoices-issued-interface';
import {CalculableInvoice} from '../../../interfaces/calculate-interface';
import {
  CATEGORIES_LABELS,
  COLLECTION_METHOD_LABELS,
  COLLECTION_STATUS_LABELS
} from '../../../shared/Collection-Enum/collection-enum';

@Injectable({
  providedIn: 'root'
})
export class InvoicesUtilService {

  constructor() {
  }

  /**
   * Convierte cualquier fecha (string) a formato YYYY-MM-DD para inputs HTML
   * @param dateString - Fecha en formato ISO ("2025-07-11T10:30:00Z") o similar
   * @returns Fecha en formato "2025-07-11" o undefined si no hay fecha válida
   */
  formatDateForInput(dateString: string | null | undefined): string | undefined {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    // Verificar si la fecha es válida para evitar "Invalid Date"
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to formatDateForInput:', dateString);
      return undefined;
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Maneja el cambio de estado de cobro de una factura
   * Si se marca como "cobrado" sin fecha, pone la fecha actual
   * Si se marca como "pendiente", limpia la fecha de cobro
   * @param invoice - La factura a modificar
   */
  handleCollectionStatusChange(invoice: Invoice): void {
    if (invoice.collection_status === 'collected') {
      // Si marca como cobrado y no tiene fecha, poner fecha de hoy
      if (!invoice.collection_date) {
        invoice.collection_date = this.getCurrentDateForInput();
      }
    } else {
      // Si marca como pendiente, limpiar fecha de cobro
      invoice.collection_date = undefined;
      invoice.collection_reference = undefined; // Limpiar referencia si pasa a pendiente
      invoice.collection_notes = undefined; // Limpiar notas si pasa a pendiente
    }
  }


  /*/!**
   * Inicializa valores por defecto para los campos de cobro
   * @param invoice - La factura a inicializar
   *!/
  initializeCollectionDefaults(invoice: Invoice): void {
    if (invoice.collection_status === 'collected' && !invoice.collection_date) {
      invoice.collection_date = this.getCurrentDateForInput();
    }
  }

  /!**
   * Valida si una factura marcada como cobrada tiene fecha de cobro
   * @param invoice - La factura a validar
   * @returns true si es válida, false si falta la fecha
   *!/
  validateCollectedInvoiceHasDate(invoice: Invoice): boolean {
    return !(invoice.collection_status === 'collected' && !invoice.collection_date);
  }

  /!**
   * Obtiene el mensaje de validación para factura cobrada sin fecha
   * NOTA: Este método devuelve un string, pero el uso de SweetAlert debe ser en el COMPONENTE.
   * @returns string con el mensaje de error (sin usar Swal.fire)
   *!/
  getCollectedWithoutDateMessage(): string {
    return 'Las facturas marcadas como cobradas deben tener una fecha de cobro.';
  }
*/




  /**
   * Formatea todas las fechas de una factura para enviar al backend
   * Esto es necesario porque el backend espera fechas en formato YYYY-MM-DD
   *
   * @param invoice - La factura con fechas a formatear
   * @returns La factura con fechas formateadas
   */
  formatInvoiceDatesForBackend(invoice: Invoice): Invoice { // CAMBIO: formatBillDatesForBackend, bill: Bill a invoices: Invoice
    // Hacemos una copia de la factura para no modificar la original
    const formattedInvoice = {...invoice};

    // Formateamos cada fecha usando la función que ya tienes
    formattedInvoice.invoice_date = this.formatDateForInput(formattedInvoice.invoice_date); // CAMBIO: date a invoice_date
    formattedInvoice.collection_date = this.formatDateForInput(formattedInvoice.collection_date); // CAMBIO: payment_date a collection_date
    formattedInvoice.start_date = this.formatDateForInput(formattedInvoice.start_date);
    formattedInvoice.end_date = this.formatDateForInput(formattedInvoice.end_date);

    return formattedInvoice;
  }



  /**
   * Determina si una factura es proporcional
   */
  isInvoiceProportional(invoice: Invoice): boolean {
    return invoice.is_proportional === 1;
  }


  /**
   * Genera la descripción del período para facturas proporcionales
   */
  getProportionalPeriod(invoice: Invoice): string {
    if (!this.isInvoiceProportional(invoice)) {
      return '-';
    }

    if (invoice.start_date && invoice.end_date) {
      const startDate = new Date(invoice.start_date);
      const endDate = new Date(invoice.end_date);

      const startFormatted = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const endFormatted = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;

      return `${startFormatted} al ${endFormatted}`;
    }

    return 'Sin período';
  }

  /**
   * Formatea el mes de correspondencia para mostrar
   */
  getCorrespondingMonthDisplay(invoice: Invoice): string {
    if (!invoice.corresponding_month) {
      return '-';
    }

    const [year, month] = invoice.corresponding_month.split('-');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${monthName} ${year}`;
  }


  /**
   * Calcula los días facturados para facturas proporcionales
   */
  getProportionalDays(invoice: Invoice): string {
    if (!this.isInvoiceProportional(invoice) || !invoice.start_date || !invoice.end_date) {
      return '-';
    }

    const startDate = new Date(invoice.start_date);
    const endDate = new Date(invoice.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${diffDays} días`;
  }


// ==========================================================
// 🆕 FUNCIONES REUTILIZABLES GENÉRICAS DE RECEIVED Y ISSUED
// ==========================================================

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns Fecha actual en formato "2025-07-11"
   * SE UTILIZA EN RECEIVED Y ISSUED
   */
  getCurrentDateForInput(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calcula el total de una factura (normal o proporcional)
   * @param invoice - La factura a calcular
   * @param onProportionalDatesChangeCallback - Función del componente para manejar cálculo proporcional
   * SE UTILIZA EN RECEIVED Y ISSUED
   */
  calculateTotal(invoice: CalculableInvoice, onProportionalDatesChangeCallback?: () => void): void {
    if (invoice.is_proportional === 1) {
      // Si es proporcional, llamar al callback del componente
      if (onProportionalDatesChangeCallback) {
        onProportionalDatesChangeCallback();
      }
    } else {
      // Si es normal, usar cálculo estándar
      const base = parseFloat(invoice.tax_base?.toString() || '0') || 0;
      // Maneja ambos nombres de propiedades
      const ivaPercent = parseFloat((invoice.iva || invoice.iva_percentage)?.toString() || '0') || 0;
      const irpfPercent = parseFloat((invoice.irpf || invoice.irpf_percentage)?.toString() || '0') || 0;

      const total = base + (base * ivaPercent / 100) - (base * irpfPercent / 100);

      // Asigna a ambas propiedades para compatibilidad
      invoice.total = parseFloat(total.toFixed(2));
      invoice.total_amount = parseFloat(total.toFixed(2));
    }
  }

// =================================================
// 🆕 FUNCIONES REUTILIZABLES GENÉRICAS DE RECEIVED
// =================================================

  /**
   * Verifica si una factura está vencida
   * @param invoice - Factura (Invoice o InvoiceReceived)
   * @returns true si está vencida, false si no
   */
  isOverdue<T extends { due_date?: string, collection_status?: string }>(invoice: T): boolean {
    if (!invoice.due_date || invoice.collection_status === 'paid' || invoice.collection_status === 'collected') {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return dueDate < today;
  }

  /**
   * Obtiene la clase CSS para el estado de pago/cobro
   * @param status - Estado de pago/cobro
   * @returns Clase CSS correspondiente
   */
  getPaymentStatusClass(status: string | undefined): string {
    switch (status) {
      case 'paid':
      case 'collected':
        return 'paid-badge';
      case 'overdue':
        return 'overdue-badge';
      case 'disputed':
        return 'disputed-badge';
      case 'pending':
      default:
        return 'pending-badge';
    }
  }

  /**
   * Obtiene la clase CSS para una categoría (sistema escalable)
   * @param category - Categoría de la factura
   * @returns Clase CSS generada automáticamente
   */
  getCategoryClass(category: string | undefined): string {
    if (!category) return 'category-default';

    // Convierte cualquier categoría a clase CSS válida
    // Ej: "Servicios Públicos" → "category-servicios-publicos"
    return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Trunca un texto a una longitud máxima
   * @param text - Texto a truncar
   * @param maxLength - Longitud máxima
   * @returns Texto truncado con "..." si es necesario
   */
  truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  //=====================================================
  // METODOS PARA LOS ETIQUETAS LABELS EN LOS COMPONENTES
  //=====================================================

  /**
   * Obtiene la etiqueta legible para un estado de cobro
   */
  getStatusLabel(status: string): string {
    return COLLECTION_STATUS_LABELS.find(item => item.value === status)?.label || status;
  }

  /**
   * Obtiene la etiqueta legible para un método de cobro
   */
  getMethodLabel(method: string): string {
    return COLLECTION_METHOD_LABELS.find(item => item.value === method)?.label || method;
  }

  /**
   * Obtiene la etiqueta legible para una categoría
   */
  getCategoryLabel(category: string): string {
    return CATEGORIES_LABELS.find(item => item.value === category)?.label || category;
  }


}
