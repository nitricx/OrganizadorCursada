import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CourseOrganizerComponent } from './components/course-organizer/course-organizer.component';
import { Calendar } from './components/calendar/calendar';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [
    CourseOrganizerComponent,
    Calendar,
    SidebarComponent,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  isOpen = signal(true);
}
