import { Component, ChangeDetectionStrategy, inject, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CareerService } from '../../services/career.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-career-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './career-selector.component.html',
  styleUrl: './career-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerSelectorComponent {
  readonly careerService = inject(CareerService);
  private readonly toastService = inject(ToastService);

  readonly activeCareerName = computed(() => {
    return this.careerService.activeCareer()?.name || 'Seleccionar Carrera';
  });

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onCareerChange(careerId: string): void {
    this.careerService.selectCareer(careerId);
    const active = this.careerService.activeCareer();
    if (active) {
      this.toastService.info(`Carrera seleccionada: ${active.name}`);
    }
  }

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.endsWith('.json')) {
      this.toastService.error('El archivo debe tener extensión .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const result = this.careerService.importCareerFromJson(content);
      if (result.success) {
        const active = this.careerService.activeCareer();
        this.toastService.success(`Plan de estudio importado correctamente: "${active?.name || 'Carrera'}"`);
      } else {
        this.toastService.error(result.error || 'No se pudo importar la carrera.');
      }
      // Reset input value to allow selecting same file again if needed
      input.value = '';
    };

    reader.onerror = () => {
      this.toastService.error('Error al leer el archivo local.');
      input.value = '';
    };

    reader.readAsText(file);
  }
}
