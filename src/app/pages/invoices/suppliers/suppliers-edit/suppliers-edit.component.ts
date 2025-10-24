import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {PAYMENT_TERMS_LABELS} from '../../../../shared/Collection-Enum/collection-enum';
import {ActivatedRoute, Router} from '@angular/router';
import {SuppliersService} from '../../../../core/services/entity-services/suppliers.service';
import {ValidatorService} from '../../../../core/services/validator-services/validator.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliers-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './suppliers-edit.component.html',
  styleUrl: './suppliers-edit.component.css'
})
export class SuppliersEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DEL FORMULARIO
  // ==========================================
  supplierForm: FormGroup;

  // Estado de carga y envío
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  // ID del proveedor a editar
  supplierId: number = 0;

  // Datos del proveedor actual
  currentSupplier: Suppliers | null = null;

  // ==========================================
  // LABELS
  // ==========================================
  paymentTermsLabels = PAYMENT_TERMS_LABELS;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private suppliersService: SuppliersService,
    private validatorService: ValidatorService,
  ) {
    // Inicializar formulario con todos los campos
    this.supplierForm = this.fb.group({
      // Información básica
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      company_name: ['', [Validators.maxLength(255)]],
      tax_id: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],

      // Dirección
      address: ['', [Validators.maxLength(500)]],
      postal_code: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.maxLength(100)]],
      province: ['', [Validators.maxLength(100)]],
      country: ['España', [Validators.maxLength(100)]],

      // Contacto
      email: ['', [Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(20)]],
      contact_person: ['', [Validators.maxLength(255)]],

      // Información comercial y bancaria
      payment_terms: [30, [Validators.required, Validators.min(0), Validators.max(365)]],
      bank_account: ['', [Validators.maxLength(34)]],

      // Notas
      notes: ['', [Validators.maxLength(1000)]],

      // Estado (siempre activo al crear)
      active: [true]
    });
  }

  ngOnInit(): void {
    this.getSupplierId()
    this.loadSupplierData()
  }

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================
  /**
   * Obtiene el ID del proveedor desde los parámetros de la ruta
   */
  getSupplierId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.supplierId = parseInt(id, 10);
    } else {
      this.router.navigate(['/dashboards/suppliers/list']);
    }
  }

  /**
   * Carga los datos del proveedor a editar
   */
  loadSupplierData(): void {
    if (!this.supplierId || this.supplierId <= 0) {
      console.error('No se pudo obtener el ID del proveedor');
      this.router.navigate(['/dashboards/suppliers/list']);
      return;
    }

    this.isLoading = true;

    this.suppliersService.getSupplierById(this.supplierId).subscribe({
      next: (supplier) => {
        this.currentSupplier = supplier;
        this.populateForm(supplier);
        this.isLoading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.isLoading = false;
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Llena el formulario con los datos del proveedor existente
   */
  populateForm(supplier: Suppliers): void {
    this.supplierForm.patchValue({
      name: supplier.name || '',
      company_name: supplier.company_name || '',
      tax_id: supplier.tax_id || '',
      address: supplier.address || '',
      postal_code: supplier.postal_code || '',
      city: supplier.city || '',
      province: supplier.province || '',
      country: supplier.country || 'España',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contact_person: supplier.contact_person || '',
      payment_terms: supplier.payment_terms || 30,
      bank_account: supplier.bank_account || '',
      notes: supplier.notes || '',
      active: supplier.active !== undefined ? supplier.active : true
    });
  }

  // ==========================================
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  /**
   * Verifica si un campo es inválido para mostrar errores
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    return this.validatorService.getErrorMessage(this.supplierForm, fieldName);
  }

  // ==========================================
  // MÉTODOS DE ENVÍO
  // ==========================================

  /**
   * Procesa la actualización del formulario
   */
  onSubmit(): void {
    if (this.supplierForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      // Aplicar transformaciones usando ValidatorService
      this.validatorService.applyTransformations(this.supplierForm, 'supplier');

      // Preparar datos
      const supplierData = this.prepareFormData();

      // Enviar al servidor
      this.suppliersService.updateSupplier(this.supplierId, supplierData).subscribe({
        next: (response) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/dashboards/suppliers/list']);
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          // Error manejado por interceptor
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
    }
  }

  /**
   * Prepara los datos del formulario para envío
   */
  prepareFormData(): Partial<Suppliers> {
    const formValues = this.supplierForm.value;

    return {
      name: formValues.name,
      company_name: formValues.company_name || null,
      tax_id: formValues.tax_id,
      address: formValues.address || null,
      postal_code: formValues.postal_code || null,
      city: formValues.city || null,
      province: formValues.province || null,
      country: formValues.country || 'España',
      email: formValues.email || null,
      phone: formValues.phone || null,
      contact_person: formValues.contact_person || null,
      payment_terms: parseInt(formValues.payment_terms) || 30,
      bank_account: formValues.bank_account || null,
      notes: formValues.notes || null,
      active: formValues.active
    };
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN
  // ==========================================

  /**
   * Vuelve al listado
   */
  goBack(): void {
    if (this.supplierForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/dashboards/suppliers/list']);
        }
      });
    } else {
      this.router.navigate(['/dashboards/suppliers/list']);
    }
  }
}
