import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="onboarding-container">
      <div class="welcome-card glass-panel">
        <header class="welcome-header">
          <div class="logo-badge">
            <span class="logo-icon">🎓</span>
          </div>
          <h1 class="welcome-title">¡Bienvenido/a a OrganizadorCursada!</h1>
          <p class="welcome-subtitle">
            Planifica tu carrera universitaria, visualiza correlativas en tiempo real y organiza tu calendario de cursadas sin esfuerzo.
          </p>
        </header>

        <section class="action-cards-grid">
          <!-- Card 1: Workshop Hub (Primary) -->
          <div class="action-card primary-card" (click)="onOpenWorkshop.emit()">
            <div class="card-badge">Recomendado</div>
            <div class="card-icon-wrapper">
              <span class="card-icon">🛒</span>
            </div>
            <div class="card-content">
              <h3>Elegir del Workshop</h3>
              <p>Explora el catálogo comunitario y suscríbete al plan de estudio oficial de tu universidad en 1 clic.</p>
            </div>
            <button class="btn btn-primary" (click)="$event.stopPropagation(); onOpenWorkshop.emit()">
              <span>Explorar Plan Hub</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>

          <!-- Card 2: Import Plan -->
          <div class="action-card" (click)="onImportPlan.emit()">
            <div class="card-icon-wrapper">
              <span class="card-icon">📂</span>
            </div>
            <div class="card-content">
              <h3>Importar Plan</h3>
              <p>¿Tienes un archivo JSON o un enlace de un compañero? Impórtalo al instante a tu lienzo.</p>
            </div>
            <button class="btn btn-secondary" (click)="$event.stopPropagation(); onImportPlan.emit()">
              <span>Importar Archivo</span>
            </button>
          </div>

          <!-- Card 3: Demo Plan -->
          <div class="action-card" (click)="onLoadDemoPlan.emit()">
            <div class="card-icon-wrapper">
              <span class="card-icon">⚡</span>
            </div>
            <div class="card-content">
              <h3>Plan de Muestra</h3>
              <p>Prueba las funciones interactivas (arrastrar materias, simular aprobación) con un plan de demo.</p>
            </div>
            <button class="btn btn-secondary" (click)="$event.stopPropagation(); onLoadDemoPlan.emit()">
              <span>Cargar Demo</span>
            </button>
          </div>
        </section>

        <footer class="features-footer">
          <div class="feature-item">
            <span class="feature-icon">🧩</span>
            <span>Árbol de Correlativas Dinámico</span>
          </div>
          <div class="feature-divider">•</div>
          <div class="feature-item">
            <span class="feature-icon">📅</span>
            <span>Organizador de Comisiones</span>
          </div>
          <div class="feature-divider">•</div>
          <div class="feature-item">
            <span class="feature-icon">🔒</span>
            <span>100% Privado y Local</span>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 24px 16px;
    }
    .glass-panel {
      background: rgba(24, 24, 37, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      color: #cdd6f4;
      max-width: 960px;
      width: 100%;
      padding: 40px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .welcome-header {
      max-width: 640px;
      margin-bottom: 36px;
    }
    .logo-badge {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, rgba(137, 180, 250, 0.2), rgba(203, 166, 247, 0.2));
      border: 1px solid rgba(137, 180, 250, 0.3);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px auto;
    }
    .logo-icon {
      font-size: 2.2rem;
    }
    .welcome-title {
      font-size: 2.1rem;
      font-weight: 700;
      color: #f5e0dc;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #f5e0dc 30%, #b4befe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .welcome-subtitle {
      font-size: 1.05rem;
      color: #a6adc8;
      line-height: 1.6;
      margin: 0;
    }
    .action-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      width: 100%;
      margin-bottom: 36px;
    }
    .action-card {
      background: #1e1e2e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .action-card:hover {
      transform: translateY(-4px);
      border-color: rgba(137, 180, 250, 0.4);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    }
    .primary-card {
      background: linear-gradient(180deg, #1e1e2e 0%, rgba(30, 30, 46, 0.95) 100%);
      border: 1px solid rgba(137, 180, 250, 0.3);
    }
    .primary-card:hover {
      border-color: #89b4fa;
      box-shadow: 0 14px 28px rgba(137, 180, 250, 0.15);
    }
    .card-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      background: rgba(137, 180, 250, 0.2);
      color: #89b4fa;
      border: 1px solid rgba(137, 180, 250, 0.3);
      border-radius: 12px;
    }
    .card-icon-wrapper {
      width: 52px;
      height: 52px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .card-icon {
      font-size: 1.8rem;
    }
    .card-content h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #cdd6f4;
      margin: 0 0 8px 0;
    }
    .card-content p {
      font-size: 0.88rem;
      color: #a6adc8;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }
    .btn {
      width: 100%;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary {
      background: #89b4fa;
      color: #11111b;
    }
    .btn-primary:hover {
      background: #b4befe;
    }
    .btn-secondary {
      background: #313244;
      color: #cdd6f4;
    }
    .btn-secondary:hover {
      background: #45475a;
      color: #fff;
    }
    .btn-arrow {
      font-size: 1.1rem;
      transition: transform 0.2s ease;
    }
    .action-card:hover .btn-arrow {
      transform: translateX(4px);
    }
    .features-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      width: 100%;
      font-size: 0.85rem;
      color: #6c7086;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .feature-divider {
      color: #45475a;
    }
  `]
})
export class OnboardingWelcomeComponent {
  @Output() onOpenWorkshop = new EventEmitter<void>();
  @Output() onImportPlan = new EventEmitter<void>();
  @Output() onLoadDemoPlan = new EventEmitter<void>();
}
