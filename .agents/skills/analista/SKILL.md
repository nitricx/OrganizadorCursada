---
name: analista
description: Functional requirements analysis, domain modeling, user stories, and acceptance criteria specification for OrganizadorCursada. Trigger when defining new features, breaking down user stories, refining business rules, validating prerequisite logic, or handling edge cases. Triggers: analista, analyst, requirements, user stories, acceptance criteria, gherkin, functional analysis, edge cases, domain rules.
---

# Business & Functional Analyst Skill

This skill defines the methodology for requirements analysis, academic domain modeling, and functional specification within **OrganizadorCursada**.

---

## 1. Domain Models & Core Business Rules

The system models the university academic trajectory of students, covering degree study plans, subjects, commissions, and strict prerequisite rules.

### Course Status Lifecycle (`CourseStatus`)

```
[pending] ---> [coursing] ---> [coursed] ---> [approved]
   ^                                               |
   +-----------------------------------------------+
```

1. **`pending`**: Subject not yet taken. Default initial state.
2. **`coursing`**: Student is currently attending classes in the active term.
   - **Enrollment rule**: Requires all direct prerequisite subjects in `cursarReqId` to be in at least `coursed` or `approved` state.
   - **Nested prior rule**: Requires subjects in `aprobarReqId` of the direct `cursarReqId` prerequisites to be in `approved` state.
3. **`coursed` (Regular)**: Subject with practical assignments and midterms passed, pending final exam. Carries the same prerequisite requirements as `coursing`.
4. **`approved` (Promoted / Final Exam Passed)**: Subject fully credited in the academic record.
   - **Approval rule**: Requires all direct prerequisites in `aprobarReqId` to be in `approved` state.

### Downstream Lock Safety Rule

> [!IMPORTANT]
> A prior prerequisite subject (e.g., _Math 1_) **CANNOT be demoted to a lower status** if an active downstream dependent subject (e.g., _Math 2_ in `coursing`, `coursed`, or `approved` state) relies on _Math 1_ maintaining its current condition. The user must first demote dependent subjects before demoting prerequisite ancestors.

### Privacy Airgap Rule

- Student progress (`CourseStatus`, personal notes, selected commissions) belongs strictly to the local device (`localStorage`) using the `UserProgressOverlay` model.
- Public degree manifests (`PlanManifest`) shared in the Workshop Hub are immutable and anonymous, stripped of all personal tracking data ($k$-anonymity).

---

## 2. Functional Specification Methodology

When analyzing or specifying a new feature or refinement, follow this structure:

### 1. Problem Statement & Context

- What student or planner problem does this solve?
- What academic value does it deliver to the student experience?

### 2. User Stories

Write using the standard user story template:

```text
As a [user persona: student / career advisor / faculty]
I want [capability or action]
So that [desired benefit or outcome]
```

### 3. Acceptance Criteria (Gherkin Format)

Specify testable criteria with binary clarity (pass / fail):

```gherkin
Scenario: Student attempts to enroll in a subject with pending prerequisites
  Given the student has "Algebra 1" in "pending" status
  And "Algebra 2" requires "Algebra 1" to be coursed
  When the student attempts to change "Algebra 2" to "coursing"
  Then the system blocks the transition
  And displays a warning notification indicating that "Algebra 1" must be coursed or approved first.
```

### 4. Edge Cases & Boundary Conditions

Proactively investigate:

- **Circular dependencies**: Does the degree study plan contain any closed circular prerequisite chains?
- **Annual vs. semester subjects**: How does the attribute `q: 3` (annual) impact course grid layouts and the weekly timetable?
- **Subjects without commissions**: How should the UI behave if a subject has no scheduled teacher/room slots in `lessons`?
- **Multi-career switching**: How do custom stored plans interact when the user switches between degree plans in the catalog?
- **Offline operation**: Does the action function without network access, properly persisting to `localStorage`?

---

## 3. Service & Component Impact Matrix

Map affected layers before presenting specifications to development:

| Requirement Scope              | Affected Services                           | Affected Components / Views                          |
| :----------------------------- | :------------------------------------------ | :--------------------------------------------------- |
| Prerequisite validation logic  | `CourseService`                             | `course-card`, `course-grid`, `requisites-flow`      |
| Weekly timetable / calendar    | `CourseService`, `CalendarExportService`    | `calendar`, `calendar-card`, `export-calendar-modal` |
| Degree plan creation / cloning | `PlanService`, `CareerService`              | `course-organizer`, `workshop-hub`                   |
| Community plan publishing      | `PlanSanitizerService`, `PlanLinterService` | `plan-publisher-modal`, `plan-diff-viewer`           |

---

## 4. Analyst Verification Checklist

- [ ] Does the requirement strictly align with the 4-stage course lifecycle (`pending`, `coursing`, `coursed`, `approved`)?
- [ ] Does it account for the Downstream Lock Safety Rule?
- [ ] Is student progress protected by the local Privacy Airgap?
- [ ] Are empty states, offline behavior, and boundary edge cases addressed?
- [ ] Are acceptance criteria written in unambiguous, testable Gherkin scenarios?
