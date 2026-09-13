# Rule: Centralized CSS Design Tokens & Zero Hardcoded Colors

1. **Strict Prohibition of Hex/RGB Hardcoded Colors**:
   - Do NOT write hardcoded hexadecimal strings (`#ffffff`, `#1a1a1a`, `#00897b`, `#3b82f6`, `#ef4444`, etc.) or `rgb(...)` / `rgba(...)` color values inside component CSS files (`*.component.css`) or HTML inline `style="..."` attributes.
   - All color assignments MUST use the centralized CSS Design Tokens defined in `src/styles.css` using `var(--...)`.

2. **Core Palette Tokens to Consume**:
   - Backgrounds & Surfaces: `var(--color-background-primary)`, `var(--color-background-secondary)`, `var(--color-surface-card)`, `var(--color-surface-hover)`.
   - Typography: `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-tertiary)`.
   - Brand & Focus: `var(--brand-primary)`, `var(--brand-primary-hover)`, `var(--brand-accent)`.
   - Academic Statuses: `var(--status-pending-bg)`, `var(--status-coursing-bg)`, `var(--status-coursed-bg)`, `var(--status-approved-bg)`.
   - System Feedback: `var(--color-danger-bg)`, `var(--color-danger-text)`, `var(--color-warning-bg)`, `var(--color-warning-text)`, `var(--color-success-bg)`.

3. **Mandatory Dual-Theme Compatibility**:
   - Any new color token introduced in `src/styles.css` MUST include declarations for both the root default (light theme) under `:root` and the dark theme under `[data-theme="dark"]`.
   - Ensure color contrast ratios conform to WCAG 2.1 Level AA (minimum 4.5:1 for normal text) across both themes.
