import { Routes } from '@angular/router';
import { CourseOrganizerComponent } from './features/dashboard/course-organizer/course-organizer.component';
import { Calendar } from './features/schedule/calendar/calendar';
import { AcademicCalendarComponent } from './features/academic-calendar/academic-calendar/academic-calendar.component';
import { RequisitesFlowComponent } from './features/prerequisites/requisites-flow/requisites-flow.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: CourseOrganizerComponent },
  { path: 'myWeek', component: Calendar },
  { path: 'academicCalendar', component: AcademicCalendarComponent },
  { path: 'academicCalendar/plan/:id', component: AcademicCalendarComponent },
  { path: 'requisites', component: RequisitesFlowComponent },
];
