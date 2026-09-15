import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanPublisherModalComponent } from './plan-publisher-modal.component';

describe('PlanPublisherModalComponent', () => {
  let component: PlanPublisherModalComponent;
  let fixture: ComponentFixture<PlanPublisherModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanPublisherModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanPublisherModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debe renderizar el botón de volver en el encabezado de la página de publicación', () => {
    const backBtn = fixture.nativeElement.querySelector('button[aria-label="Volver"]');
    expect(backBtn).toBeNull();
  });

  it('debe renderizar el título e icono del encabezado correctamente con clases de diseño', () => {
    const header = fixture.nativeElement.querySelector('header.app-header-bar.app-page-header');
    expect(header).toBeTruthy();

    const title = fixture.nativeElement.querySelector('h1.page-title.app-page-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Compartir / Publicar Plan de Estudio');
  });
});
