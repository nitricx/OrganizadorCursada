# Rule: Feature-Based Project Structure & Organization

1. **Feature/Domain Component Organization**:
   - Do NOT place new UI components flat inside `src/app/components/`.
   - New components MUST be organized into feature/domain subdirectories (`src/app/features/<domain>/` or `src/app/components/<domain>/`), or `src/app/shared/` if shared globally across multiple views.
   - Domains:
     - `dashboard`: Components for `/home` (`course-organizer`, `course-grid`, `course-card`, `course-organizer-legend`).
     - `schedule`: Components for `/myWeek` (`calendar`, `calendar-card`, `calendar-legend`, `lesson-selector-modal`, `export-calendar-modal`).
     - `academic-calendar`: Components for `/academicCalendar` (`academic-calendar`).
     - `workshop`: Components for `/workshop` (`workshop-hub`, `plan-publisher-modal`, `plan-diff-viewer`, `career-selector`).
     - `shared`: Reusable layout and cross-cutting components (`sidebar`, `user-menu`, `toast-container`, `advisory-badge`, `lineage-indicator`, `no-plan-selected`, `onboarding-welcome`).

2. **Categorized Service Layers**:
   - Organize services by responsibility:
     - `domain`: Central state management (`CourseService`, `PlanService`, `CareerService`).
     - `sync`: Remote sync and I/O (`FirestoreSyncService`, `PlanImportExportService`).
     - `security`: Validation and privacy (`PlanSanitizerService`, `PlanLinterService`, `AntiSybilService`).
     - `utils`: UI helper services (`CalendarExportService`, `ThemeService`, `ToastService`).

3. **Single Responsibility & Co-location**:
   - Each component directory must co-locate its template, styles, component class, and tests (if applicable).
