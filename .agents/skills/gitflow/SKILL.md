---
name: gitflow
description: GitFlow and version control guidelines for OrganizadorCursada. Trigger when managing branches, creating commits, opening Pull Requests, performing merges, rebases, or tagging releases. Triggers: gitflow, git, branch, commit, PR, pull request, merge, rebase, tag, release, hotfix.
---

# GitFlow & Version Control Skill

This skill defines the branching model, branch naming conventions, commit structure, and integration workflows for the **OrganizadorCursada** repository.

---

## 1. Branch Strategy & Naming Conventions

The repository follows a GitFlow workflow adapted for agile continuous delivery:

| Branch              | Purpose                                                                                  | Base Branch | Merges Into          |
| :------------------ | :--------------------------------------------------------------------------------------- | :---------- | :------------------- |
| `main`              | Production-ready, stable release code. Every commit maps to a tagged release (`vX.Y.Z`). | -           | -                    |
| `develop`           | Primary continuous integration branch. Contains the latest verified changes.             | `main`      | `main` (via release) |
| `feature/<name>`    | New capabilities or enhancements. Example: `feature/workshop-voting`.                    | `develop`   | `develop`            |
| `bugfix/<name>`     | Non-critical bug fixes identified during development cycles.                             | `develop`   | `develop`            |
| `hotfix/<name>`     | Urgent production fixes patching critical defects.                                       | `main`      | `main` & `develop`   |
| `release/<version>` | Release stabilization, final audits, and version bumping.                                | `develop`   | `main` & `develop`   |

### Branch Naming Rules

- Use lowercase alphanumeric characters separated by hyphens (`kebab-case`).
- Include semantic prefix: `feature/`, `bugfix/`, `hotfix/`, `release/`, `refactor/`, `chore/`.
- Example: `feature/add-cytoscape-export`, `bugfix/prerequisite-lock-cycle`.

---

## 2. Conventional Commits Specification

All commit messages must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) format:

```text
<type>(<optional scope>): <imperative concise summary>

[optional body explaining motivation and context]

[optional footer referencing issue keys or BREAKING CHANGE notices]
```

### Allowed Types

- **`feat`**: Introduces a new feature to the application (e.g., `feat(schedule): add google calendar export link`).
- **`fix`**: Patches a defect or bug (e.g., `fix(course-service): prevent demoting prerequisite with coursing dependent`).
- **`refactor`**: Code changes that neither fix a bug nor add a feature (e.g., `refactor(signals): migrate to input() and output() api`).
- **`test`**: Adds missing tests or corrects existing test suites (e.g., `test(plan-service): add unit tests for custom plan cloning`).
- **`docs`**: Documentation updates or skill file adjustments (e.g., `docs(skills): add gitflow instructions`).
- **`style`**: Formatting or design token consumption without logic changes (e.g., `style(theme): apply design tokens to workshop hub`).
- **`perf`**: Code modifications that improve execution performance (e.g., `perf(cytoscape): debounce layout calculations`).
- **`chore`**: Maintenance tasks, dependencies, or configuration (e.g., `chore(deps): update angular to 21.2.7`).

### Commit Quality Guidelines

- Use the imperative mood: _"add feature"_ or _"fix bug"_, never _"added"_ or _"fixing"_.
- Keep the first summary line under 72 characters.
- Maintain atomic commits: each commit represents a single cohesive logical change.

---

## 3. Standard Operational Workflow

### Starting a Task (Feature or Bugfix)

1. Ensure your local `develop` branch is up to date:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Create and switch to your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### During Development

- Commit atomically as logical milestones are completed.
- Keep your branch synchronized with `develop` using rebase:
  ```bash
  git fetch origin
  git rebase origin/develop
  ```

### Pre-Commit & Pre-Push Validation

Before committing or creating a Pull Request, verify project health:

1. Run unit test suites:
   ```bash
   npm test -- --watch=false
   ```
2. Validate compilation:
   ```bash
   npm run build
   ```
3. Run E2E tests when modifying critical user journeys:
   ```bash
   npm run test:e2e
   ```

---

## 4. Pull Requests & Code Review

When opening a Pull Request (PR):

- **Title**: Follow Conventional Commits syntax (e.g., `feat(workshop): allow downloading community career manifests`).
- **Description**: Include:
  - **Summary**: Concise overview of changes.
  - **Motivation**: Why the modification was needed.
  - **Verification Steps**: Reproducible steps demonstrating success.
  - **Checklist**: Unit tests passing, design tokens respected, zero `any` types.
- **Merge Strategy**: **MANDATORY Squash and Merge**. All Pull Requests MUST squash their commits into a single cohesive commit upon merging into target branches (`develop` or `main`) to preserve a clean, linear history.

---

## 5. Safe Conflict Resolution

- When conflicts arise during rebase:
  1. Inspect conflicting files with `git status`.
  2. Resolve conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
  3. Execute tests to confirm resolution did not introduce regressions.
  4. Stage resolved files: `git add <file>`.
  5. Continue rebase: `git rebase --continue`.
- **Golden Rule**: NEVER use `git push --force` on shared branches (`main` or `develop`). On personal feature branches, use `--force-with-lease`.
