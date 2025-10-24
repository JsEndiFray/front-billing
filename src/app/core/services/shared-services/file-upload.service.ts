import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  // Constantes de validación
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPE = 'application/pdf';

  constructor() { }

  /**
   * Valida un archivo según las reglas establecidas
   */
  validateFile(file: File): string {
    // Validar tipo de archivo
    if (file.type !== this.ALLOWED_TYPE) {
      return 'Solo se permiten archivos PDF';
    }

    // Validar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      return 'El archivo es demasiado grande. Máximo 10MB';
    }

    return ''; // Sin errores
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


  /**
   * Maneja el evento de drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Maneja el evento de drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Maneja el evento de soltar archivo
   */
  onFileDrop(event: DragEvent): File | null {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      return files[0];
    }
    return null;
  }

  /**
   * Maneja la selección de archivo mediante input
   */
  onFileSelected(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    return file || null;
  }

}
