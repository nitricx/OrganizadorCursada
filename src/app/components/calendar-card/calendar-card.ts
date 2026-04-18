import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Course } from '../../models/course';

@Component({
  selector: 'app-calendar-card',
  imports: [],
  templateUrl: './calendar-card.html',
  styleUrl: './calendar-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCard {
  course = input.required<Course>();
}
