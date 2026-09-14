import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CareerSelectorComponent } from './career-selector.component';
import { CareerIndexEntry } from '../../../models/career.model';

describe('CareerSelectorComponent', () => {
  let component: CareerSelectorComponent;
  let fixture: ComponentFixture<CareerSelectorComponent>;

  beforeEach(async () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}

    await TestBed.configureTestingModule({
      imports: [CareerSelectorComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CareerSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe establecer careerToDelete y cerrar el menu al llamar a confirmDeleteCareer', () => {
    const mockCareer: CareerIndexEntry = {
      id: 'test-career',
      name: 'Carrera de Prueba',
      university: 'UTN',
      file: 'test.json',
    };

    const mockEvent = new MouseEvent('click');
    const spyStopPropagation = vi.spyOn(mockEvent, 'stopPropagation');

    if (component.menuTrigger) {
      vi.spyOn(component.menuTrigger, 'closeMenu');
    }

    component.confirmDeleteCareer(mockCareer, mockEvent);

    expect(spyStopPropagation).toHaveBeenCalled();
    expect(component.careerToDelete()).toEqual(mockCareer);
    if (component.menuTrigger) {
      expect(component.menuTrigger.closeMenu).toHaveBeenCalled();
    }
  });

  it('should clear careerToDelete on cancel or execute deletion', () => {
    const mockCareer: CareerIndexEntry = {
      id: 'test-career',
      name: 'Carrera de Prueba',
      university: 'UTN',
      file: 'test.json',
    };

    component.careerToDelete.set(mockCareer);
    expect(component.careerToDelete()).toEqual(mockCareer);

    component.cancelDelete();
    expect(component.careerToDelete()).toBeNull();
  });
});
