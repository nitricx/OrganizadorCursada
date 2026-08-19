import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkshopHubComponent } from './workshop-hub.component';

describe('WorkshopHubComponent', () => {
  let component: WorkshopHubComponent;
  let fixture: ComponentFixture<WorkshopHubComponent>;

  beforeEach(async () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}
    await TestBed.configureTestingModule({
      imports: [WorkshopHubComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializarse con un catálogo por defecto', () => {
    expect(component).toBeTruthy();
    expect(component.catalog.length).toBeGreaterThan(0);
  });

  it('debe filtrar los planes por término de búsqueda en la propiedad searchQuery', () => {
    component.searchQuery = 'sistemas';
    const result = component.filteredAndSortedCatalog;
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) =>
      item.name.toLowerCase().includes('sistemas') ||
      item.university.toLowerCase().includes('sistemas') ||
      item.faculty.toLowerCase().includes('sistemas')
    )).toBe(true);
  });

  it('debe filtrar de forma insensible a tildes y diacríticos (ej: tecnologica encuentra Tecnológica)', () => {
    component.catalog = [
      ...component.catalog,
      {
        id: 'test-tecnologica',
        name: 'Ingeniería Tecnológica',
        university: 'Universidad Tecnológica Nacional',
        faculty: 'Facultad Regional',
        subscribersRange: '10-50',
        version: '1.0.0',
        updatedAt: '2026-08-19',
        manifest: { id: 'test-tecnologica', name: 'Ingeniería Tecnológica', university: 'UTN', faculty: 'FR', version: '1.0.0', courses: [] }
      }
    ];

    component.searchQuery = 'tecnologica';
    let result = component.filteredAndSortedCatalog;
    expect(result.some((item) => item.id === 'test-tecnologica')).toBe(true);

    component.searchQuery = 'Tecnológica';
    result = component.filteredAndSortedCatalog;
    expect(result.some((item) => item.id === 'test-tecnologica')).toBe(true);
  });

  it('debe ordenar por nombre de carrera (name) en orden ascendente y descendente', () => {
    component.sortColumn = 'name';
    component.sortDirection = 'asc';
    let result = component.filteredAndSortedCatalog;
    expect(result[0].name.localeCompare(result[1].name, 'es')).toBeLessThanOrEqual(0);

    component.toggleSort('name'); // Cambia a desc
    expect(component.sortDirection).toBe('desc');
    result = component.filteredAndSortedCatalog;
    expect(result[0].name.localeCompare(result[1].name, 'es')).toBeGreaterThanOrEqual(0);
  });

  it('debe ordenar por facultad en orden ascendente y descendente', () => {
    component.toggleSort('faculty'); // Cambia columna a faculty asc
    expect(component.sortColumn).toBe('faculty');
    expect(component.sortDirection).toBe('asc');
    let result = component.filteredAndSortedCatalog;
    expect(result[0].faculty.localeCompare(result[1].faculty, 'es')).toBeLessThanOrEqual(0);

    component.toggleSort('faculty'); // Cambia a desc
    expect(component.sortDirection).toBe('desc');
    result = component.filteredAndSortedCatalog;
    expect(result[0].faculty.localeCompare(result[1].faculty, 'es')).toBeGreaterThanOrEqual(0);
  });

  it('debe emitir onClose al hacer click en cerrar', () => {
    let closed = false;
    component.onClose.subscribe(() => (closed = true));
    const closeBtn = fixture.nativeElement.querySelector('.btn-close');
    closeBtn.click();
    expect(closed).toBe(true);
  });
});
