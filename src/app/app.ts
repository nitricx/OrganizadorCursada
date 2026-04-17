import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseOrganizerComponent } from './components/course-organizer/course-organizer.component';
import { Calendar } from './components/calendar/calendar';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [CommonModule, CourseOrganizerComponent, Calendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
