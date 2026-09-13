---
name: ux-ui-design-system
description: Design system guidelines, CSS design tokens, dark and light theme support, and web accessibility standards for OrganizadorCursada. Trigger when styling components, modifying HTML templates, authoring CSS files, or adjusting UI layouts. Triggers: css, styles, theme, dark mode, design tokens, accessibility, a11y, ui, ux, colors, layout, responsive.
---

# Design System, CSS Tokens & Accessibility Skill (UX/UI)

This skill defines the aesthetic guidelines, centralized **Design Tokens**, and accessibility standards for the user interface of **OrganizadorCursada**.

---

## 1. The Core Styling Rule: Zero Hardcoded Colors

> [!WARNING]
> Hardcoding static hexadecimal values (`#ffffff`, `#000000`, `#3b82f6`, `#00897b`, etc.) or static `rgb(...)` colors in component CSS files or HTML `style="..."` attributes is **strictly forbidden**.
>
> All color values and surface elevations **must** consume centralized CSS Design Tokens defined in `src/styles.css`.

### Why?

The application features dynamic light and dark theme switching managed by `ThemeService` through the `data-theme="dark"` attribute on the root `<html>` element. Any hardcoded color inevitably breaks contrast or readability in one of the two modes.

---

## 2. Design Tokens Catalog (`src/styles.css`)

### Brand Colors & Surfaces

| Token                               | Light Theme | Dark Theme (`[data-theme="dark"]`) | Usage                                  |
| :---------------------------------- | :---------- | :--------------------------------- | :------------------------------------- |
| `var(--brand-primary)`              | `#185fa5`   | `#0284c7`                          | Primary buttons, active links, accents |
| `var(--color-background-primary)`   | `#ffffff`   | `#1e1e24`                          | Main page background                   |
| `var(--color-background-secondary)` | `#e8e7e0`   | `#2a2a32`                          | Container backgrounds, inputs, panels  |
| `var(--color-surface-card)`         | `#ffffff`   | `#1e1e24`                          | Course cards (`course-card`), modals   |
| `var(--color-surface-hover)`        | `#f5f4f0`   | `#262630`                          | Hover states on cards, rows, buttons   |
| `var(--color-border-secondary)`     | `#c5c3bb`   | `#374151`                          | Standard dividing borders              |

### Typography & Text Tokens

| Token                         | Recommended Application                              |
| :---------------------------- | :--------------------------------------------------- |
| `var(--color-text-primary)`   | Headings, primary titles, emphasized course names    |
| `var(--color-text-secondary)` | Subtitles, professor names, secondary timetable info |
| `var(--color-text-tertiary)`  | Muted metadata, credit counters                      |

### Course Status Semantic Tokens

Use these tokens for course cards, status badges, and timetable legends:

```css
/* Pending (Pendiente) */
background-color: var(--status-pending-bg);
color: var(--status-pending-color);
border-color: var(--status-pending-border);

/* Coursing (Cursando) */
background-color: var(--status-coursing-bg);
color: var(--status-coursing-color);
border-color: var(--status-coursing-border);

/* Coursed / Regular (Cursada) */
background-color: var(--status-coursed-bg);
color: var(--status-coursed-color);
border-color: var(--status-coursed-border);

/* Approved (Aprobada) */
background-color: var(--status-approved-bg);
color: var(--status-approved-color);
border-color: var(--status-approved-border);

/* Hover Highlights (Prerequisite Flow) */
background-color: var(--status-req-bg); /* Required prerequisite */
background-color: var(--status-unlocks-bg); /* Unlocked successor */
```

### System Feedback & Banners

- **Danger / Blocked**: `var(--color-danger-bg)`, `var(--color-danger-text)`, `var(--color-danger-border)`.
- **Warning**: `var(--color-warning-bg)`, `var(--color-warning-text)`, `var(--color-warning-border)`.
- **Success**: `var(--color-success-bg)`, `var(--color-success-text)`, `var(--color-success-border)`.
- **Info Banners**: `var(--banner-info-bg)`, `var(--banner-info-text)`, `var(--banner-info-border)`.

---

## 3. Web Accessibility (a11y) Standards

1. **Color Contrast (WCAG 2.1 Level AA)**:
   - Text rendered on any card or button background must achieve at least a **4.5:1** contrast ratio (or 3:1 for large display text).
   - Test both light theme (`:root`) and dark theme (`[data-theme="dark"]`).
2. **Keyboard Navigation & Visible Focus**:
   - Never suppress focus outlines without a clear replacement:
     ```css
     button:focus-visible,
     a:focus-visible {
       outline: 2px solid var(--brand-primary);
       outline-offset: 2px;
     }
     ```
3. **Touch Targets**:
   - Interactive buttons and icons must maintain a minimum target area of **44x44px** on touch viewports.
4. **Semantic HTML & ARIA**:
   - Use `<button>` for actions and `<a>` for navigational links.
   - For icon-only buttons, always supply an `aria-label="Action description"`.

---

## 4. Responsive Layouts & Complex Views

- **Course Grid (`/home`)**:
  - Organized by academic years and semesters.
  - On mobile screens (`< 768px`), layout must adapt to horizontal scrolling or chronological collapsible accordions.
- **Weekly Timetable (`/myWeek`)**:
  - Monday-through-Saturday grid matrix.
  - On mobile screens, provide day-by-day tabs to prevent cramped lesson slots.
- **Fluid Transitions**:
  - Use `var(--transition-fast)` (`0.15s`) for micro-interactions and `var(--transition-normal)` (`0.25s`) for dialogs and accordions.

---

## 5. UX/UI Review Checklist

- [ ] Was the component inspected in both light and dark themes?
- [ ] Do all colors resolve to CSS variables (`var(--...)`) defined in `src/styles.css`?
- [ ] Do buttons implement `:hover`, `:active`, and `:focus-visible` states?
- [ ] Does text contrast satisfy WCAG AA requirements in both themes?
- [ ] Do course cards visibly communicate their canonical status without ambiguity?
