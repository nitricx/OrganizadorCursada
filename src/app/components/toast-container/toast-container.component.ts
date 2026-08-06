import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getIcon(type: ToastType): string {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'check_circle';
      case 'info':
      default:
        return 'info';
    }
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
