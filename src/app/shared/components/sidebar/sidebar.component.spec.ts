import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render items including Calendario Académico as a single route item', () => {
    const items = component.items();
    expect(items.length).toBe(5);
    const academicItem = items.find((i) => i.label === 'Calendario Académico');
    expect(academicItem).toBeDefined();
    expect(academicItem?.route).toBe('/academicCalendar');
    expect(academicItem?.icon).toBe('date_range');
  });

  it('should handle action items when emitted', () => {
    const workshopSpy = vi.spyOn(component.onOpenWorkshop, 'emit');
    component.handleAction({ label: 'Workshop', action: 'open_workshop' });
    expect(workshopSpy).toHaveBeenCalled();
  });
});
