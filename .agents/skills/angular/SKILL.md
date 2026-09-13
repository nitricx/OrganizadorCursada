---
name: angular
description: Architecture standards and best practices for modern Angular 21+ in OrganizadorCursada. Trigger when creating, refactoring, or maintaining standalone components, Angular Signals, dependency injection with inject(), modern template control flow (@if, @for), or CSS design tokens. Triggers: angular, component, signals, signal, computed, effect, standalone, control flow, inject, input, output, template, css tokens.
---

# Modern Angular 21 & TypeScript Skill

This skill defines the technical standards, modern APIs, and architectural patterns for developing with **Angular 21** in **OrganizadorCursada**.

---

## 1. Core Framework Rules

1. **Mandatory Standalone Components**:
   - Every component, directive, and pipe must be declared as standalone (`standalone: true` or default Angular 21 component declarations).
   - Do NOT use `NgModule`. Import dependencies directly into the `@Component({ imports: [...] })` array.

2. **Modern Dependency Injection via `inject()`**:
   - Replace constructor parameter injection with the functional `inject()` API:

   ```typescript
   // Correct
   private readonly courseService = inject(CourseService);
   private readonly router = inject(Router);

   // Forbidden
   constructor(private courseService: CourseService, private router: Router) {}
   ```

3. **Functional Signal-Based Inputs & Outputs**:
   - Use signal inputs (`input()`, `input.required()`) and outputs (`output()`) instead of decorator-based `@Input()` and `@Output()`:

   ```typescript
   // Inputs
   public readonly course = input.required<Course>();
   public readonly isCompact = input<boolean>(false);

   // Outputs
   public readonly statusChange = output<CourseStatus>();
   public readonly cardClick = output<void>();
   ```

4. **Modern Template Control Flow**:
   - Do NOT use legacy structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).
   - Use native block control flow syntax:

   ```html
   @if (course().status === 'approved') {
   <span class="badge approved">Approved</span>
   } @else if (course().status === 'coursing') {
   <span class="badge coursing">Coursing</span>
   } @else {
   <span class="badge pending">Pending</span>
   } @for (lesson of lessons(); track lesson.id) {
   <app-calendar-card [lesson]="lesson" />
   } @empty {
   <p class="empty-state">No scheduled commissions available.</p>
   }
   ```

---

## 2. Reactive State Management with Signals

### Signal Store Pattern in Services

Services act as the application's Single Source of Truth:

- Internal mutable state managed via private `signal<T>()`.
- Public immutable state exposed using `.asReadonly()`.
- Derived read-only state calculated with `computed()`.

```typescript
@Injectable({ providedIn: 'root' })
export class CourseService {
  // Private mutable state
  private readonly _courses = signal<Course[]>([]);
  private readonly _courseStatuses = signal<Map<number, CourseStatus>>(new Map());

  // Public read-only exposure
  public readonly courses = this._courses.asReadonly();
  public readonly courseStatuses = this._courseStatuses.asReadonly();

  // Memoized reactive computed signals
  public readonly coursingCourses = computed(() =>
    this._courses().filter((c) => this._courseStatuses().get(c.id) === 'coursing'),
  );

  // Immutable state mutations
  public setStatus(courseId: number, status: CourseStatus): void {
    const updated = new Map(this._courseStatuses());
    updated.set(courseId, status);
    this._courseStatuses.set(updated); // Always emit a new reference
  }
}
```

### Signal Rules in Components

- In templates, invoke signals as functions: `{{ course().name }}`.
- For side effects (such as DOM manipulation or external libraries like Cytoscape), use `effect()` inside an injection context.

---

## 3. RxJS Interoperability & Memory Leak Prevention

When using RxJS Observables (e.g. route parameters or HTTP streams):

1. **Prevent Memory Leaks**: Always use `takeUntilDestroyed()` or the `async` pipe in templates.
2. **Convert to Signals**: Use `toSignal(observable$, { initialValue: ... })` from `@angular/core/rxjs-interop` for straightforward reactive consumption in templates.

```typescript
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Component({ ... })
export class MyFeatureComponent {
  private readonly route = inject(ActivatedRoute);

  public readonly planId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: null }
  );
}
```

---

## 4. Centralized CSS Design Tokens

> [!WARNING]
> Hardcoding static hexadecimal colors (`#ffffff`, `#1a1a1a`, `#3b82f6`, etc.) in component styles or inline `style="..."` attributes is strictly forbidden.
> All styles must consume centralized CSS Design Tokens defined in `src/styles.css`:

```css
/* CORRECT */
.card-container {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
}

.badge-approved {
  background-color: var(--status-approved-bg);
  color: var(--status-approved-text);
}

/* FORBIDDEN */
.card-container {
  background-color: #ffffff; /* Breaks dark mode */
  color: #1f2937;
}
```

---

## 5. Strict TypeScript

- **No `any` Type**: Always provide explicit types, interfaces, or generics. If a value is dynamic or unknown at compile time, use `unknown` with narrowing type guards.
- **Explicit Signatures**: Provide explicit parameter and return types for all public service and component methods.

---

## 6. Feature-Based Directory Structure

Follow domain-based organization defined in `.agents/rules/project-structure.md`:

- Place components under `src/app/features/<domain>/` or `src/app/shared/`.
- Co-locate template, style, component class, and specs:
  ```text
  my-feature/
  ├── my-feature.component.ts
  ├── my-feature.component.html
  ├── my-feature.component.css
  └── (my-feature.component.spec.ts optional)
  ```
