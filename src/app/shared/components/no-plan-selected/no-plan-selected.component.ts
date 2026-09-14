import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PlanService } from '../../../services/plan.service';
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
  private readonly toastService = inject(ToastService);

  title = input<string>('Sin Plan Seleccionado');
  description = input<string>(
    'Seleccioná un plan de estudio para comenzar a organizar tu carrera, visualizar tu horario semanal .',
  );
  icon = input<string>('school');

  onOpenPlanHub(): void {
    this.planService.openWorkshop();
  }

  onLoadDemoPlan(): void {
    this.planService.loadDemoPlan();
    this.toastService.info('Plan de demostración cargado correctamente.');
  }
}
