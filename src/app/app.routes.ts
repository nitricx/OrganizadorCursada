import { Routes } from '@angular/router';
import { CourseOrganizerComponent } from './components/course-organizer/course-organizer.component';
import { Calendar } from './components/calendar/calendar';
import { AcademicCalendarComponent } from './components/academic-calendar/academic-calendar.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: CourseOrganizerComponent },
  { path: 'calendar', component: Calendar },
  { path: 'academicCalendar', component: AcademicCalendarComponent },
];
