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
      providers: [provideRouter([{ path: 'home', component: WorkshopHubComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component successfully and initialize with default catalog', () => {
    expect(component).toBeTruthy();
    expect(component.catalog.length).toBeGreaterThan(0);
  });

  it('should filter plans by search term in searchQuery property', () => {
    component.searchQuery = 'sistemas';
    const result = component.filteredAndSortedCatalog;
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (item) =>
          item.name.toLowerCase().includes('sistemas') ||
          item.university.toLowerCase().includes('sistemas') ||
          item.faculty.toLowerCase().includes('sistemas'),
      ),
    ).toBe(true);
  });

  it('should filter insensitively to accents and diacritics (e.g. tecnologica matches Tecnológica)', () => {
    component.catalog = [
      ...component.catalog,
      {
        id: 'test-tecnologica',
        name: 'Ingeniería Tecnológica',
        university: 'Universidad Tecnológica Nacional',
        faculty: 'Facultad Regional',
        version: '1.0.0',
        updatedAt: '2026-08-19',
        manifest: {
          id: 'test-tecnologica',
          name: 'Ingeniería Tecnológica',
          university: 'UTN',
          faculty: 'FR',
          version: '1.0.0',
          courses: [],
        },
      },
    ];

    component.searchQuery = 'tecnologica';
    let result = component.filteredAndSortedCatalog;
    expect(result.some((item) => item.id === 'test-tecnologica')).toBe(true);

    component.searchQuery = 'Tecnológica';
    result = component.filteredAndSortedCatalog;
    expect(result.some((item) => item.id === 'test-tecnologica')).toBe(true);
  });

  it('should sort by career name (name) in ascending and descending order', () => {
    component.sortColumn = 'name';
    component.sortDirection = 'asc';
    let result = component.filteredAndSortedCatalog;
    expect(result[0].name.localeCompare(result[1].name, 'es')).toBeLessThanOrEqual(0);

    component.toggleSort('name'); // Changes to desc
    expect(component.sortDirection).toBe('desc');
    result = component.filteredAndSortedCatalog;
    expect(result[0].name.localeCompare(result[1].name, 'es')).toBeGreaterThanOrEqual(0);
  });

  it('should sort by faculty in ascending and descending order', () => {
    component.toggleSort('faculty'); // Changes column to faculty asc
    expect(component.sortColumn).toBe('faculty');
    expect(component.sortDirection).toBe('asc');
    let result = component.filteredAndSortedCatalog;
    expect(result[0].faculty.localeCompare(result[1].faculty, 'es')).toBeLessThanOrEqual(0);

    component.toggleSort('faculty'); // Changes to desc
    expect(component.sortDirection).toBe('desc');
    result = component.filteredAndSortedCatalog;
    expect(result[0].faculty.localeCompare(result[1].faculty, 'es')).toBeGreaterThanOrEqual(0);
  });

  it('should not render back button in header of workshop hub', () => {
    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Volver"]');
    expect(closeBtn).toBeNull();
  });
});
