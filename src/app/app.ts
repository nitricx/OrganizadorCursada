import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseOrganizerComponent } from './components/course-organizer/course-organizer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [CommonModule, CourseOrganizerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
