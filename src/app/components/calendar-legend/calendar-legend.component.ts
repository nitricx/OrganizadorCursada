import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CourseOrganizerLegendComponent } from '../course-organizer-legend/course-organizer-legend.component';

@Component({
  selector: 'app-calendar-legend',
  standalone: true,
  imports: [CourseOrganizerLegendComponent],
  templateUrl: './calendar-legend.component.html',
  styleUrl: './calendar-legend.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarLegendComponent {}
