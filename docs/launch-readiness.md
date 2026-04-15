# AIVO v3 Launch Readiness Checklist

## Accessibility (WCAG 2.1 AA)

- [x] SkipLink component on all dashboard layouts
- [x] Sidebar navigation with proper ARIA roles and labels
- [x] `aria-current="page"` on active nav links
- [x] `aria-hidden="true"` on decorative emoji icons
- [x] AccessibleToggle component with `role="switch"`
- [x] Focus-visible outlines globally (purple ring, 2px offset)
- [x] `prefers-reduced-motion` support in globals.css
- [x] Error alerts with `role="alert"` and `aria-live="assertive"`
- [x] Loading states with `role="status"` and `aria-live="polite"`
- [x] Login/signup: password toggle aria-labels, submit aria-busy
- [x] BrainVisualization: region role, SVG aria-label
- [x] Stage assessment: answer feedback live region, choice aria-labels
- [x] Breadcrumb navigation with aria-label
- [x] Notification button aria-expanded + unread count

## Dashboard Architecture

- [x] Admin dashboard with sidebar layout
- [x] District dashboard with sidebar layout
- [x] Internal dashboard with sidebar layout
- [x] Teacher dashboard decomposed: overview, reports, lesson-plans, settings
- [x] Therapist dashboard decomposed: caseload, reports, sessions, settings
- [x] Caregiver dashboard decomposed: overview, observations, sessions, settings

## Color Contrast

- [x] Upgraded text-slate-400 to text-slate-500 across layouts
- [x] Upgraded text-[10px] to text-xs for readability
- [x] DashboardHeader role text uses text-slate-500

## CI/CD

- [x] Security scan workflow with correct permissions
- [x] Accessibility lint CI workflow
- [x] PR review template with a11y checklist
- [x] Temp files cleaned from repo
- [x] .gitignore updated

## Documentation

- [x] Accessibility guidelines (docs/accessibility-guidelines.md)
- [x] Launch readiness checklist (docs/launch-readiness.md)
- [x] PR template (.github/PULL_REQUEST_TEMPLATE.md)

## Remaining Items for Production

- [ ] eslint-plugin-jsx-a11y integration in web app
- [ ] Playwright a11y test suite (axe-core)
- [ ] i18n accessibility verification (screen reader tested in EN + ES)
- [ ] Full keyboard navigation audit
- [ ] VoiceOver/NVDA manual testing pass
