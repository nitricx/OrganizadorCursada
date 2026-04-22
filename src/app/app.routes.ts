import { Routes } from '@angular/router';
import { CourseOrganizerComponent } from './components/course-organizer/course-organizer.component';
import { Calendar } from './components/calendar/calendar';
import { AcademicCalendarComponent } from './components/academic-calendar/academic-calendar.component';
import { RequisitesFlowComponent } from './components/requisites-flow/requisites-flow.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: CourseOrganizerComponent },
  { path: 'myWeek', component: Calendar },
  { path: 'academicCalendar', component: AcademicCalendarComponent },
  { path: 'academicCalendar/plan/:id', component: AcademicCalendarComponent },
  { path: 'requisites', component: RequisitesFlowComponent },
];
