# Weekly Schedule Calendar Feature Module ("myWeek") 🗓️

The **Weekly Calendar** (`/myWeek`) provides students with a visual weekly schedule (timetable grid) of all their enrolled class sessions and lessons across days of the week.

---

## 🔑 Key Functionalities

1. **Weekly Timetable View**:
   - Displays a grid spanning Monday (`DayOfWeek.Monday = 0`) through Saturday (`DayOfWeek.Saturday = 5`).
   - Time slots organized vertically by start/end times (`startTime` - `endTime`).

2. **Lesson Session Cards (`calendar-card`)**:
   - Renders individual scheduled lessons for enrolled/selected subjects.
   - Displays subject name, professor/instructor, room assignment, and session status badge.

3. **Status Filters**:
   - Enables filtering displayed classes by status (e.g. view only active `cursando` subjects or include all planned sessions).

4. **Schedule Conflict & Overlap Detection**:
   - Identifies time slot collisions when multiple lessons overlap on the same day and time.
   - Highlights conflicting slots visually to assist students in resolving schedule overlaps.

---

## 🧩 Related Components & Services

- **Components**:
  - `Calendar` (`calendar.ts`, `calendar.html`, `calendar.css`)
  - `CalendarCard` (`calendar-card/`)
  - `CalendarLegend` (`calendar-legend/`)
- **Services**:
  - `CourseService` (`src/app/services/course.service.ts`)

---

## 💡 Data Structures

- Uses `Lesson` objects attached to `Course` models:
  ```ts
  export interface Lesson {
    id: string; // e.g. 'PA1-L1'
    professor: string;
    day: DayOfWeek; // 0..5
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    status?: CourseStatus;
  }
  ```
