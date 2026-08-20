import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COURSE_STATUS_LIST } from '../../../constants/course-status.constants';
import { CourseService } from '../../../services/course.service';
import { LegendFilterKey } from '../../../models/course';

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
  private readonly courseService = inject(CourseService);

  readonly disabledFilters = computed(() => this.courseService.disabledStatusFilters());

  onChipClick(key: LegendFilterKey): void {
    this.courseService.toggleStatusFilter(key);
  }

  isChipDisabled(key: LegendFilterKey): boolean {
    return this.disabledFilters().has(key);
  }
}

