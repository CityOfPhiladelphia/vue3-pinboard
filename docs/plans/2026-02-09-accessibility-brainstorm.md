# Accessibility Brainstorm: vue3-pinboard

_Date: 2026-02-09_
_Status: Brainstorm — no decisions finalized, no implementation started_

## Legal Context

- ADA Title II final rule (April 2024) requires state/local government web content to conform to **WCAG 2.1 Level AA**
- Compliance deadline: **April 24, 2026**
- Philadelphia has an existing accessibility policy and is working toward compliance
- All pinboard-based apps (farmers markets, recycling, primary care, etc.) are affected

## The Core Problem

Interactive maps cannot be made visually accessible to blind users. Pinboard apps present data both on a map and in a list view. The list view is the accessible path — it already exists but needs proper accessibility implementation.

## Architecture Context

vue3-pinboard uses MapLibre GL directly — it does NOT use @phila/phila-ui-map-core (that's phila-ui-4, used by newer apps like openmaps). Pinboard depends on older vendor components from phila-ui-3:

- `@phila/phila-ui-app-header`
- `@phila/phila-ui-app-footer`
- `@phila/phila-ui-dropdown` (sort/distance controls)
- `@phila/phila-ui-radio` (refine panel radio buttons)

pinboard-3 is in early development and will eventually replace vue3-pinboard. However, the April 2026 deadline means accessibility work needs to happen in vue3-pinboard now. pinboard-3 should incorporate these patterns from the start.

## Responsibility Split

### Pinboard is responsible for:
- Making the list view, search, filters, detail panels, and all UI controls fully accessible
- Providing proper semantic structure and landmarks
- Keyboard navigation throughout the app
- Screen reader announcements for dynamic content changes
- Labeling the map region so assistive tech users know to use the list instead

### Consuming apps (farmers-markets-finder, etc.) are responsible for:
- Providing the `aria-label` that describes what the map shows in their context
- Ensuring any custom components (customGreeting, ExpandCollapseContent) are accessible
- All data the app presents must be retrievable without using the map

## What Pinboard Already Has

- Skip-to-main-content link in App.vue
- `<main>` element wrapping primary content
- `<fieldset>` and `<legend>` in TooltipCheckbox.vue
- `aria-checked` on checkboxes
- `aria-expanded` in PrintView.vue
- `aria-label="Close modal"` on PhilaModal
- Keyboard handlers: Enter on search, Enter/Space on list items and refine panel
- `tabindex="0"` on interactive divs in RefinePanel and ExpandCollapse
- Hidden label on address search input

## Scope: Pinboard-Only vs Blocked on phila-ui-3

### In scope — changes within pinboard's own code (~75-80% of the work)

#### Semantic Structure & Landmarks (Main.vue)
- Add `<nav>` to navigation areas
- Wrap RefinePanel in `<aside>` with appropriate role
- Add `role="region"` or `<section>` to content areas (list, map)
- Add `aria-label` to each landmark so screen readers can differentiate them

#### Results List (LocationsPanel)
- Container needs `role="list"`, items need `role="listitem"` (currently plain divs)
- `aria-live="polite"` on result count so screen readers announce when results change after filtering
- "Select All" checkbox needs clear association with the result list

#### Expandable Items (ExpandCollapse)
- Add `aria-expanded` attribute (true/false) on the trigger
- Add `aria-controls` linking trigger to expanded content
- Font Awesome expand/collapse icons need `aria-hidden="true"`
- Consider focus management when expanding (move focus into expanded content)

#### Refine Panel (RefinePanel)
- Refine toggle title needs `aria-expanded` (currently has `role="button"` but no expanded state)
- Add `aria-controls` linking title to panel content
- Dropdown checkbox expand (line 716) only responds to click — needs keyboard support too
- Filter pill buttons (`.box-value` divs) need proper ARIA

#### Search (AddressSearchControl)
- Hidden label positioning may not work with all screen readers — verify or switch to `sr-only` class approach
- Clear button and search button: switch from `title` to `aria-label`
- Consider `aria-live` announcement when search completes with results

#### Map Container (Map.vue)
- Add `role="img"` with `aria-label` from consuming app's config (e.g., "Map showing farmers market locations")
- Pinboard uses MapLibre directly, so map accessibility is handled here, not in map-core

#### Mobile View Toggle (Main.vue)
- List/Map toggle buttons need `aria-label`
- Active button needs `aria-pressed="true"` to indicate current view

#### Modal (PhilaModal)
- Add `role="alertdialog"` or `role="dialog"`
- Add `aria-labelledby` pointing to title
- Add focus trapping (tab should cycle within modal)
- Restore focus to trigger element on close

#### Icons Throughout
- All decorative Font Awesome icons need `aria-hidden="true"`
- Icons that convey meaning need `aria-label` or associated text

#### Focus Management
- Visible `:focus-visible` styles on all interactive elements (currently some are removed, e.g., map popup close button)
- When detail panels expand, manage focus appropriately
- When modals open, trap focus; when closed, restore focus

#### Dynamic Content
- `aria-live="polite"` on areas that update: result counts, search status
- `aria-busy` on loading states
- Error states should use `role="alert"`

### Blocked on phila-ui-3 — needs team decision (~20-25% of the work)

These components come from phila-ui-3 and can't be fixed within pinboard alone:

#### `@phila/phila-ui-dropdown` (sort/distance controls in LocationsPanel)
- Needs `aria-label` describing purpose
- Needs keyboard navigation (arrow keys, Escape)
- Needs `aria-expanded` on toggle
- **Workaround options**: wrap with ARIA attributes at pinboard level, or replace with accessible inline implementation

#### `@phila/phila-ui-radio` (refine panel radio buttons)
- Needs proper fieldset/legend grouping
- Needs keyboard navigation (arrow keys within group)
- **Workaround options**: wrap with ARIA at pinboard level, or replace with accessible inline implementation

#### `@phila/phila-ui-app-header` and `@phila/phila-ui-app-footer`
- Accessibility state unknown — needs audit
- Likely passable as-is (standard header/footer pattern) but unverified
- Lower priority than dropdown and radio

#### Decision needed from team:
1. **Fix it in phila-ui-3** — invest in old code that's being replaced
2. **Work around it in pinboard** — override/wrap vendor components at pinboard level
3. **Replace in pinboard** — swap vendor components for accessible inline implementations
4. **Accept the gap** — document it and fix in pinboard-3

## Open Questions

- **MapPopup accessibility**: Should popup content announce to screen readers via live region? Or is it sufficient that the same data is available in the list view? (Deferred — easy to add later)
- **Touch targets**: Filter boxes and small controls may be below the 44x44px minimum for mobile. Needs visual audit.
- **Color contrast**: Section tags and disabled states may not meet 4.5:1 contrast ratio. Needs testing with contrast checker.
- **Form validation**: Currently uses toasts for errors. Needs field-level error messages? Or is toast sufficient for WCAG AA?
