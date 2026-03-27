import { Component, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SettingsService } from '../../core/services/entity-services/settings.service';
import { Settings } from '../../interfaces/stats-interface';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {

  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  isSubmitting = false;

  readonly settingsData = toSignal<Settings | null>(
    this.settingsService.getSettings(),
    { initialValue: null }
  );

  readonly form = this.fb.group({
    userName:    [{ value: '', disabled: true }],
    email:       ['', [Validators.required, Validators.email]],
    companyName: ['', [Validators.maxLength(255)]],
    cif:         ['', [Validators.maxLength(20)]],
    address:     ['', [Validators.maxLength(500)]],
    defaultTax:  [21, [Validators.required, Validators.min(0), Validators.max(100)]],
    currency:    ['EUR', [Validators.required]]
  });

  constructor() {
    effect(() => {
      const data = this.settingsData();
      if (data) {
        this.form.patchValue(data);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const raw = this.form.getRawValue();

    const payload: Settings = {
      userName:    raw.userName ?? '',
      email:       raw.email ?? '',
      companyName: raw.companyName ?? '',
      cif:         raw.cif ?? '',
      address:     raw.address ?? '',
      defaultTax:  raw.defaultTax ?? 21,
      currency:    raw.currency ?? 'EUR'
    };

    this.settingsService.updateSettings(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire({ title: 'Guardado', text: 'Configuración actualizada', icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboards']);
  }
}
