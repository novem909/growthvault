# GrowthVault Continuation Plan (v3.0)

## Executive Summary

Recent analysis (see `CRITICAL-DISCOVERY.md`) shows that a refactor was
started on **20 Oct 2025** and halted after the CSS and basic project structure
were extracted into modular files. The remaining work is predominantly the
migration of the **inline JavaScript (~1,500 lines)** from `growthvault.html`
into the modular architecture already scaffolded via `index.html` and the
`css/` and `js/` directories.

**Goal**: Finish the existing refactor rather than starting from scratch.

- `growthvault.html` (monolith) → 3,248 lines (inline CSS/JS/HTML)
- `index.html` (modular shell) → 147 lines (no inline CSS, references external assets)
- External CSS (6 files) → 1,465 lines ✅ already linked
- External JS utilities → 287 lines (`js/ui-utils.js`, `js/firebase-config.js`)

**Timeline**: 12–18 working days (~2–3 weeks part-time)  
**Risk**: Medium (working with partially migrated code)  
**Strategy**: Stabilise `index.html`, extract and modularise remaining logic,
then retire the monolith once feature parity is confirmed.

---

## Phase 0 – Revalidation & Environment Prep (Day 1)

Purpose: Confirm baseline and ensure the modular shell (`index.html`) is usable
as the primary entry point.

### Tasks
- [ ] Check out a new working branch (e.g. `refactor/js-extraction`)
- [ ] Run `npm install` (if applicable) or confirm local tooling requirements
- [ ] Open `index.html` in the browser and capture console/network output
- [ ] Document current breakages (expected: script load error at line 148)
- [ ] Confirm external CSS files render correctly via `index.html`
- [ ] Snapshot current UI behaviour (screenshots/video) for regression checks

### Deliverables
- Baseline test log including console errors and rendering notes
- List of blockers preventing `index.html` from functioning today

### Exit Criteria
- `index.html` loads, even if functionality is limited, and you understand the
  immediate failures (primarily missing application JS)

---

## Phase 1 – Stabilise Modular Entry Point (Days 2–3)

Purpose: Replace the broken script reference in `index.html` with a temporary
module entry point so the page initialises without pulling code from the
monolith.

### Tasks
- [ ] Create `js/main.js` (ES module) that logs a warning and initialises the
      minimal functionality (e.g. theme toggle via `ui-utils.js`)
- [ ] Update `index.html`:
  - Remove `<script src="./growthvault.html">`
  - Add `<script type="module" src="./js/main.js"></script>`
- [ ] Ensure Firebase compat scripts remain loaded *before* `main.js`
- [ ] Verify page loads without fatal errors (limited functionality is fine)

### Deliverables
- Working modular entry point scaffold
- Updated `index.html`

### Exit Criteria
- Console shows no 404/parse errors; `main.js` executes and is ready to host
  migrated logic

---

## Phase 2 – Extract Core Application Logic (Days 4–10)

Purpose: Migrate `VisualListBuilder` and related logic from `growthvault.html`
into cohesive modules while maintaining behaviour parity.

### Module Migration Checklist
- [ ] `js/config.js` – constants (storage keys, limits)
- [ ] `js/storage-manager.js` – localStorage persistence helpers
- [ ] `js/state-manager.js` – central state with observer pattern
- [ ] `js/list-manager.js` – CRUD for items/authors, undo stack
- [ ] `js/ui-manager.js` – DOM rendering, template population
- [ ] `js/modal-manager.js` – modal open/close, content population
- [ ] `js/event-handlers.js` – event delegation (form submit, buttons, drag)
- [ ] `js/firebase-manager.js` – auth + realtime database sync
- [ ] `js/validators.js` – input/file validation
- [ ] Extend `js/main.js` to compose the managers and bootstrap the app

### Implementation Notes
- Migrate functionality incrementally; keep `growthvault.html` as reference
- After each module extraction, wire it into `main.js` and validate targeted
  functionality (e.g. rendering list items)
- Preserve existing behaviour (undo/redo, drag & drop, author popups, etc.)
- Reuse helpers already present in `js/ui-utils.js`

### Deliverables
- New module files with migrated logic and minimal unit/integration tests (where practical)
- Updated `main.js` performing full app initialisation

### Exit Criteria
- Application flows (load data, add/edit/delete item, modal interactions)
  function via `index.html` using only modular code

---

## Phase 3 – Remove Inline Event Handlers & Legacy Couplings (Days 11–12)

Purpose: Eliminate remaining inline attributes and ensure all interactions route
through the delegated event system.

### Tasks
- [ ] Replace `onclick`, `onchange`, `onsubmit` attributes in `index.html` with
      `data-` attributes consumed by `event-handlers.js`
- [ ] Review templates/elements generated via JS to ensure consistent structure
- [ ] Introduce HTML `<template>` blocks for repeated card/popup markup where helpful
- [ ] Confirm drag-and-drop logic operates via event handlers (not inline)

### Deliverables
- Clean `index.html` free of inline JS
- Event handler map documenting delegated selectors

### Exit Criteria
- No inline event attributes remain
- All interactions are handled through the modular event system

---

## Phase 4 – Consolidation & Retirement of Monolith (Days 13–14)

Purpose: Finalise the migration, remove unused legacy assets, and update project
structure to point to the new architecture.

### Tasks
- [ ] Verify feature parity against baseline recordings
- [ ] Rename `index.html` to `growthvault.html` (if desired) or update deploy
      targets to use the modular entry file exclusively
- [ ] Move `growthvault.html` (monolith) to an `archive/` folder or delete after backup
- [ ] Update build/deployment scripts (if any) to reference the new entry point
- [ ] Update README to describe the new structure and commands

### Deliverables
- Clean repo with single authoritative HTML entry point
- README + documentation updates

### Exit Criteria
- No production code references the old monolithic file
- CI/build (if present) succeeds with new file layout

---

## Phase 5 – Testing & QA (Days 15–17)

Purpose: Confirm stability, performance, and compatibility after the migration.

### Functional Regression
- [ ] Add item (with/without image)
- [ ] Edit item content/title/author
- [ ] Delete single item & undo/redo
- [ ] Author popup open/delete-all
- [ ] Modals (open, edit, close via ESC, click outside)
- [ ] Image zoom, FAB scroll, toast notifications
- [ ] Local storage persistence across reloads
- [ ] Firebase sync/auth (if credentials available)

### Responsive & UI Verification
- [ ] Mobile (<768px), tablet (768–1024px), desktop (>1024px)
- [ ] Dark/light theme toggle persists via localStorage
- [ ] Animations and transitions behave as before

### Performance Checks
- [ ] Page load < 2s on modern hardware
- [ ] No runaway CPU/memory usage (Chrome DevTools audit)
- [ ] Evaluate bundle size (consider optional build tooling e.g. Vite)

### Deliverables
- QA checklist with pass/fail status and remediation actions

### Exit Criteria
- All critical functionality passes manual tests
- Known issues documented with severity/workarounds

---

## Phase 6 – Documentation & Knowledge Transfer (Days 18–19)

Purpose: Record the final architecture to future-proof maintenance.

### Tasks
- [ ] Create/update `docs/ARCHITECTURE.md` with module interactions & data flow
- [ ] Document public APIs for each manager (`docs/API.md`)
- [ ] Produce `docs/COMPONENTS.md` describing key UI components & templates
- [ ] Update `docs/DEVELOPMENT.md` (setup, scripts, coding standards)
- [ ] Summarise migration learnings/issues in project notes

### Deliverables
- Comprehensive documentation set aligned with the new structure

### Exit Criteria
- New contributors can understand and modify the codebase using the docs

---

## Risk Register & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Unclear behaviour in legacy JS | Medium | High | Extract in small slices; add temporary integration tests; compare with monolith as oracle |
| Firebase auth/sync changes breaking | Medium | Medium | Wrap calls in try/catch; log errors; allow offline mode fallback |
| Drag & drop regression | Medium | Medium | Preserve existing event order; write smoke test for reordering |
| Timeline creep | Low | Medium | Use timeboxed slices; prioritise critical flows first |

---

## Success Criteria (Project Completion)

- [ ] `index.html` (or renamed equivalent) runs solely on modular JS/CSS
- [ ] All functionality present in the original monolith works identically (or improvements documented)
- [ ] No inline CSS/JS in production HTML
- [ ] Monolithic `growthvault.html` retired/archived
- [ ] Documentation reflects final architecture & developer workflow
- [ ] Optional: build tooling decision documented (Vite/Parcel/none)

---

## Suggested Timeline Snapshot

| Phase | Duration | Target Dates* |
|-------|----------|----------------|
| Phase 0 | 1 day | Day 1 |
| Phase 1 | 2 days | Days 2–3 |
| Phase 2 | 7 days | Days 4–10 |
| Phase 3 | 2 days | Days 11–12 |
| Phase 4 | 2 days | Days 13–14 |
| Phase 5 | 3 days | Days 15–17 |
| Phase 6 | 2 days | Days 18–19 |

*Adjust based on resource availability. Parallelise documentation and testing
when practical.

---

## Conclusion

By completing the in-progress JavaScript extraction and wiring the existing
modules together, the project can achieve a clean, maintainable architecture in
approximately three weeks. This plan leverages the already-finished CSS
extraction and the modular shell, focusing effort where it remains: migrating
application logic, removing legacy inline handlers, and solidifying the new
structure. Follow the outlined phases to reach parity, retire the monolith, and
leave the team with a documented, approachable codebase.
