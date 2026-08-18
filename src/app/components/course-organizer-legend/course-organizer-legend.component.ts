import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COURSE_STATUS_LIST } from '../../constants/course-status.constants';

@Component({
  selector: 'app-course-organizer-legend',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './course-organizer-legend.component.html',
  styleUrls: ['./course-organizer-legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOrganizerLegendComponent {
  readonly statusList = COURSE_STATUS_LIST;
}
