import { Component, ChangeDetectionStrategy } from '@angular/core';
import { COURSE_STATUS_LIST } from '../../constants/course-status.constants';

@Component({
  selector: 'app-course-organizer-legend',
  standalone: true,
  templateUrl: './course-organizer-legend.component.html',
  styleUrls: ['./course-organizer-legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOrganizerLegendComponent {
  readonly statusList = COURSE_STATUS_LIST;
}
