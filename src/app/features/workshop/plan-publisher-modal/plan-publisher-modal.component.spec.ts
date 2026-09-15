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

  it('should create component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should not render back button in header of publication page', () => {
    const backBtn = fixture.nativeElement.querySelector('button[aria-label="Volver"]');
    expect(backBtn).toBeNull();
  });

  it('should render header title and icon correctly with design classes', () => {
    const header = fixture.nativeElement.querySelector('header.app-header-bar.app-page-header');
    expect(header).toBeTruthy();

    const title = fixture.nativeElement.querySelector('h1.page-title.app-page-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Compartir / Publicar Plan de Estudio');
  });
});
