import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SuppliersService} from '../../../../core/services/suppliers-services/suppliers.service';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {PAYMENT_TERMS_LABELS} from '../../../../shared/Collection-Enum/collection-enum';
import {ValidatorService} from '../../../../core/services/validator-services/validator.service';

/**
 * Componente para registrar nuevos proveedores.
 * Formulario dividido en secciones con validaciones específicas.
 */
@Component({
  selector: 'app-suppliers-register',
  imports: [ReactiveFormsModule],
  templateUrl: './suppliers-register.component.html',
  styleUrl: './suppliers-register.component.css'
})
export class SuppliersRegisterComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DEL FORMULARIO
  // ==========================================
  supplierForm: FormGroup;

  // Estado de envío
  isSubmitting: boolean = false;

  // ==========================================
  // LABELS
  // ==========================================
  paymentTermsLabels = PAYMENT_TERMS_LABELS;

  constructor(
    private fb: FormBuilder,
    private suppliersService: SuppliersService,
    private router: Router,
    private validatorService: ValidatorService
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
   * Procesa el envío del formulario
   */
  onSubmit(): void {
    if (this.supplierForm && !this.isSubmitting) {
      this.isSubmitting = true;

      this.validatorService.applyTransformations(this.supplierForm, "supplier");

      // Preparar datos
      const supplierData = this.prepareFormData();

      this.suppliersService.createSupplier(supplierData).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor registrado correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/dashboards/suppliers/list']);
          });
        },
        error: (e: HttpErrorResponse) => {
          this.isSubmitting = false;
          // Error manejado por interceptor
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.supplierForm.markAllAsTouched();
    }
  }

  /**
   * Prepara los datos del formulario para envío al servidor
   */
  prepareFormData(): Partial<Suppliers> {
    const formValues = this.supplierForm.value;

    return {
      // Información básica
      name: formValues.name,
      company_name: formValues.company_name || null,
      tax_id: formValues.tax_id,

      // Dirección
      address: formValues.address || null,
      postal_code: formValues.postal_code || null,
      city: formValues.city || null,
      province: formValues.province || null,
      country: formValues.country || 'España',

      // Contacto
      email: formValues.email || null,
      phone: formValues.phone || null,
      contact_person: formValues.contact_person || null,

      // Información comercial
      payment_terms: parseInt(formValues.payment_terms) || 30,
      bank_account: formValues.bank_account || null,

      // Notas
      notes: formValues.notes || null,

      // Estado
      active: true // Siempre activo al crear
    };
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN
  // ==========================================
  /**
   * Navega de vuelta al listado
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
