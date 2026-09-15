import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../../services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    toastService.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render active toasts from ToastService', () => {
    toastService.warning('Advertencia de prueba');
    fixture.detectChanges();

    const toastElement = fixture.nativeElement.querySelector('.toast-item');
    expect(toastElement).not.toBeNull();
    expect(toastElement.textContent).toContain('Advertencia de prueba');
    expect(toastElement.classList.contains('toast-warning')).toBe(true);
  });

  it('should dismiss toast on close button click', () => {
    const id = toastService.error('Error de prueba');
    fixture.detectChanges();

    expect(toastService.toasts()).toHaveLength(1);

    const closeBtn = fixture.nativeElement.querySelector('.toast-close');
    expect(closeBtn).not.toBeNull();
    closeBtn.click();
    fixture.detectChanges();

    expect(toastService.toasts()).toHaveLength(0);
  });
});
