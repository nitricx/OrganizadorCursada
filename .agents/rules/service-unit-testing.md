# Rule: Lean Components & Mandatory Unit Tests for Service Files

1. **Lean Presentation Components**: UI Components (located in `src/app/components/`) MUST contain minimal logic. Their responsibility is strictly presentation (template binding, user interactions, displaying state via Signals). All domain logic, calculations, state mutations, and data access must be delegated to Services.
2. **Unit Tests Required for Services Only**: Every new code feature, modification, or addition saved in a Service file (e.g. files matching `*.service.ts` or located under `src/app/services/`) MUST include corresponding unit tests in a `.service.spec.ts` file.
3. **No Unit Tests Required for Components**: UI Components do NOT require unit tests unless explicitly requested by the user, as business logic is isolated within unit-tested Services.
4. **Test Verification**: Whenever a service file is created or modified, execute the test suite (e.g., `npx ng test --watch=false` or `npx vitest run`) to ensure all service tests pass cleanly before completing the task.
