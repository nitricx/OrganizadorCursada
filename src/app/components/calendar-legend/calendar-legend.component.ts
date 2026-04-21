import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CourseOrganizerLegendComponent } from '../course-organizer-legend/course-organizer-legend.component';

@Component({
  selector: 'app-calendar-legend',
  standalone: true,
  imports: [CourseOrganizerLegendComponent],
  template: '<app-course-organizer-legend></app-course-organizer-legend>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarLegendComponent {}
