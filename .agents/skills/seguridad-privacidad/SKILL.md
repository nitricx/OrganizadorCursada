---
name: seguridad-privacidad
description: Privacy policies, student data airgap, sanitization, and Workshop Hub security for OrganizadorCursada. Trigger when working with cloud synchronization, community plan publishing, user state serialization, security audits, or anti-Sybil protection. Triggers: seguridad, privacidad, airgap, privacy, anonymity, k-anonymity, sanitize, sanitizer, anti-sybil, sybil, entropy, workshop security, localstorage.
---

# Security, Privacy & Local Airgap Skill

This skill defines the architectural safeguards to protect student privacy, enforce the **Local Airgap**, and secure community plan publishing in the **Workshop Hub** within **OrganizadorCursada**.

---

## 1. The Local Airgap Principle

In OrganizadorCursada, personal student records and academic progress remain strictly quarantined to the client device:

```
[ Local Storage (Student Device) ]
  ├── Course statuses (pending / coursing / coursed / approved)
  ├── Selected commissions & professors (selectedLessonId)
  ├── Private notes & observations
  └── Custom semester overrides
        │
        │ [ STRICT AIRGAP: NEVER crosses to public network ]
        v
[ Workshop Hub / Community Repositories / Public Network ]
  ├── Immutable base degree manifests (PlanManifest)
  ├── Abstract subject definitions & prerequisite rules
  └── Public commission schedule packs (CommissionPack)
```

### Core Airgap Invariants

1. **Never transmit `UserProgressOverlay` to public services**: The `UserProgressOverlay` model (defined in `src/app/models/plan-manifest.model.ts`) exists solely in `localStorage` or encrypted under the student's personal AWS Cognito account during authenticated cloud sync.
2. **Total de-identification in the Workshop Hub**: No payload published to the community catalog may contain:
   - Individual course completion or grade data.
   - User identifiers (Cognito user IDs, names, or emails).
   - Personal notes or individual timestamps.

---

## 2. Privacy & Quality Service Layer

The application includes dedicated services under `src/app/services/` enforcing security boundaries:

| Service                    | Path                                                  | Core Responsibility                                                                                           |
| :------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **`PlanSanitizerService`** | `src/app/services/plan-sanitizer.service.ts`          | Strips identifying metadata and high-cardinality attributes prior to publication, guaranteeing $k$-anonymity. |
| **`PlanLinterService`**    | `src/app/services/plan-linter.service.ts`             | Validates schemas, sanitizes against script injection in subject titles, and detects prerequisite cycles.     |
| **`AntiSybilService`**     | `src/app/services/anti-sybil.service.ts`              | Calculates anonymity and confidence scores for community votes without tracking user identity.                |
| **`EntropyScorerService`** | `src/app/services/entropy-scorer.service.ts`          | Measures metadata variance to prevent cohort intersection fingerprinting attacks.                             |
| **`SecureStorageService`** | `src/app/services/security/secure-storage.service.ts` | Provides safe access to `localStorage`, protecting against state corruption.                                  |

---

## 3. Secure Workshop Publication Protocol

Before any custom study plan is uploaded or shared with the community:

1. **Step 1: Mandatory Pre-Publish Sanitization**:
   Call `PlanSanitizerService.sanitizeForPublish(manifest)`:
   - Strips author tags, user emails, and local creation timestamps.
   - Normalizes universal URN identifiers.
2. **Step 2: Linter Audit**:
   Execute `PlanLinterService.lintPlanManifest(manifest)`:
   - Check for malicious characters or script tags in subject descriptions.
   - Validate structural sanity (course limits, realistic term boundaries, absence of cycles).
3. **Step 3: Anti-Sybil Entropy Evaluation**:
   Verify that the plan provides authentic structural value rather than being an automated near-clone designed to spam community listings.

---

## 4. Resilient Local Storage (`SecureStorageService`)

- Always wrap `localStorage` access in resilient parsing handlers with fallback defaults.
- When introducing schema migrations (e.g. migrating subject status keys to numeric IDs), write backward-compatible migration steps to preserve existing student progress.

---

## 5. Security & Privacy Audit Checklist

- [ ] Does any code change expose student progress (`courseStatuses`, notes, schedules) in public URLs or network payloads?
- [ ] Are study plans exported to the Workshop completely de-identified?
- [ ] Are user inputs in degree plan builders sanitized against XSS?
- [ ] Do `PlanSanitizerService` and `PlanLinterService` methods have passing unit tests (`*.spec.ts`)?
