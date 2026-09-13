# Rule: Student Privacy Airgap & Workshop Sanitization

1. **Strict Local-Only Progress Storage (Airgap)**:
   - Personal academic progress data represented by the `UserProgressOverlay` model (including active `CourseStatus` mappings, notes, semester moves, and selected commission `Lesson` IDs) MUST remain strictly inside the user's `localStorage`.
   - Never transmit unanonymized personal progress data over public REST APIs or network calls.

2. **Mandatory Sanitization Before Workshop Sharing**:
   - Before publishing or exporting study plan manifests (`PlanManifest`) to the Workshop Hub, the data MUST pass through `PlanSanitizerService.sanitizeForPublish(...)`.
   - Sanitization strips user IDs, author names, creation timestamps, and individual progress tags to enforce strict $k$-anonymity and prevent cohort correlation fingerprinting.

3. **Safe Storage Parsing**:
   - Access to `localStorage` must handle potential schema corruption gracefully (via `SecureStorageService` or safe `try / catch` with fallbacks) without crashing the application or wiping student records.
