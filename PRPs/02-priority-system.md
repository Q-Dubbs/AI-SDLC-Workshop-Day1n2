# PRP 02: Priority System

## Feature Overview
Implement a three-level priority system that drives both visual emphasis and sorting/filtering behavior.

Priority values:
- high
- medium (default)
- low

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 02)
- User behavior reference: USER_GUIDE.md (Section 3)

## User Stories
- As a user, I can assign a priority when creating or editing todos.
- As a user, I can quickly identify urgency by color badge.
- As a user, I can filter list results by selected priority.

## User Flow
1. User chooses priority in create/edit form.
2. Todo displays with color-coded badge in list.
3. List auto-sorts by priority.
4. User selects a priority filter and sees subset instantly.

## Technical Requirements
### Data and Types
- Add or confirm todo.priority field in database.
- Type contract: Priority = high | medium | low.
- Default value: medium.

### API Validation
- Reject invalid enum values.
- Normalize casing if needed (store lowercase).

### UI Requirements
- Priority dropdown in create/edit forms.
- Badge color mapping:
  - high -> red
  - medium -> yellow
  - low -> blue
- Priority filter dropdown in list controls.
- Dark mode compatible colors with readable contrast.

### Sorting Behavior
- high before medium before low.
- Within same priority use due date and creation date sort rules from Feature 01.

## Edge Cases
- Missing priority from legacy data should map to medium.
- Unknown priority values should fail validation and return clear error.
- Badge colors must remain distinguishable in dark theme.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Three priority levels fully functional.
- [ ] Default priority is medium.
- [ ] Color-coded badges visible in list and edit states.
- [ ] Auto-sort by priority works.
- [ ] Priority filter returns only selected level.
- [ ] WCAG AA contrast target achieved for badge text/background.

## Testing Requirements
### E2E
- [ ] Create todo with each priority.
- [ ] Edit existing todo priority.
- [ ] Filter by each priority option.
- [ ] Verify list order high -> medium -> low.
- [ ] Validate badge display in light and dark mode.

### Unit
- [ ] Priority enum validation tests.
- [ ] Priority comparator tests.
- [ ] Badge class mapping tests.

## Out of Scope
- User-defined/custom priority scales.
- Numeric priority scoring.

## Success Metrics
- Priority assignment available in 100 percent of create/edit flows.
- Priority filter interaction updates view under 100 ms on typical dataset.
