# Rule: Angular & TypeScript Modern Best Practices

1. **Modern Dependency Injection (`inject()`)**:
   - Use `private myService = inject(MyService);` instead of constructor parameter injection.

2. **Signal-Based Inputs & Outputs**:
   - Use functional signal inputs (`input()`, `input.required()`) and outputs (`output()`) instead of traditional `@Input()` and `@Output()` decorators.

3. **Readonly Encapsulated Store State**:
   - Services MUST expose internal WritableSignal state as `readonly` using `.asReadonly()` (e.g. `public readonly courses = this._courses.asReadonly()`) to prevent components from mutating state directly.

4. **Strict TypeScript (No `any`)**:
   - Do NOT use the `any` type. Define explicit interfaces, types, or generics. Use `unknown` with narrowing type guards when dealing with dynamic input.

5. **RxJS Subscription Safety & Cleanup**:
   - When subscribing to RxJS Observables, ALWAYS use `takeUntilDestroyed()` from `@angular/core/rxjs-interop` or the `async` pipe in templates to prevent memory leaks.
