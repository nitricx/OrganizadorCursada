# 🛠️ Services & Architecture Store Layer (`src/app/services`)

This directory contains the central reactive state management stores, synchronization services, security/privacy primitives, and utility services for **OrganizadorCursada**.

---

## 📂 Service Categories

### 1. Primary Domain State Stores
- **`course.service.ts`**: Core state store powered by Angular Signals. Manages course lists, statuses, selected commission IDs (`selectedLessonId`), prerequisite validation logic (`canChangeStatusTo`), downstream locking rules, drag-and-drop semester reassignment, and active schedule lessons.
- **`plan.service.ts`**: Store managing user-created plans, plan cloning, renaming, deletion, active plan selection, and per-plan semester date ranges (`plan-semesters-{planId}`).
- **`career.service.ts`**: Multi-career degree manager. Handles loading static JSON bundles (`audiovisual.json`, `sistemas.json`), user-imported local custom plans, and remote community plans via Firebase Firestore.

### 2. Workshop Hub & Cloud Sync
- **`firestore-sync.service.ts`**: Manages remote read/write sync of public community plans (`PlanManifest`) with Firebase Firestore.

### 3. Plan Quality & Privacy Layer
- **`plan-sanitizer.service.ts`**: Pre-flight $k$-anonymity sanitizer that strips personal identifying user data, author tags, and high-cardinality fields before publishing plans to the Workshop Hub.
- **`plan-linter.service.ts`**: Audits study plan schemas for circular prerequisite dependencies, invalid course IDs, or broken semester mappings.
- **`anti-sybil.service.ts`**: Calculates anonymity entropy and anti-spam confidence scores for community-contributed plans.
- **`entropy-scorer.service.ts`**: Scores metadata variance to prevent cohort intersection fingerprinting.

### 4. Utilities & Presentation
- **`calendar-export.service.ts`**: Generates iCal (`.ics`) file definitions and Google Calendar deep-links for `coursingLessons`.
- **`auth.service.ts`**: Manages optional Firebase user authentication state.
- **`theme.service.ts`**: Controls dark/light theme switching and CSS custom property states.
- **`toast.service.ts`**: Toast notification alert dispatcher.
