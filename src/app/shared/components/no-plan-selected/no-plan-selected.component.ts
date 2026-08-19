import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PlanService } from '../../../services/plan.service';
import { CareerService } from '../../../services/career.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-no-plan-selected',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './no-plan-selected.component.html',
  styleUrl: './no-plan-selected.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoPlanSelectedComponent {
  private readonly planService = inject(PlanService);
  private readonly careerService = inject(CareerService);
  private readonly toastService = inject(ToastService);

  title = input<string>('Sin Plan Seleccionado');
  description = input<string>(
    'Seleccioná un plan de estudio para comenzar a organizar tu carrera, visualizar tu horario semanal y explorar correlatividades.',
  );
  icon = input<string>('school');

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onOpenPlanHub(): void {
    this.planService.openWorkshop();
  }

  onLoadDemoPlan(): void {
    this.planService.loadDemoPlan();
    this.toastService.info('Plan de demostración cargado correctamente.');
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
        this.toastService.success(
          `Plan de estudio importado correctamente: "${active?.name || 'Carrera'}"`,
        );
      } else {
        this.toastService.error(result.error || 'No se pudo importar la carrera.');
      }
      input.value = '';
    };

    reader.onerror = () => {
      this.toastService.error('Error al leer el archivo local.');
      input.value = '';
    };

    reader.readAsText(file);
  }
}
