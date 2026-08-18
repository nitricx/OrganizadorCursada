import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenuComponent {
  authService = inject(AuthService);
  private toastService = inject(ToastService, { optional: true });

  getFirstName(displayName: string | null | undefined, email: string | null | undefined): string {
    if (displayName) {
      return displayName.split(' ')[0];
    }
    if (email) {
      return email.split('@')[0];
    }
    return 'Usuario';
  }

  getInitial(displayName: string | null | undefined, email: string | null | undefined): string {
    const text = displayName || email || 'U';
    return text.charAt(0).toUpperCase();
  }

  openManageAccount(): void {
    window.open('https://myaccount.google.com/', '_blank');
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const user = await this.authService.loginWithGoogle();
      if (user) {
        this.toastService?.success(`¡Bienvenido/a, ${user.displayName || user.email}!`);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        this.toastService?.error('Error al iniciar sesión con Google.');
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.toastService?.info('Sesión cerrada correctamente.');
    } catch {
      this.toastService?.error('Error al cerrar sesión.');
    }
  }
}
