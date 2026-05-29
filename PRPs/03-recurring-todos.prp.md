# PRP-03: Recurring Todos

## Objective
Implement recurring todos (`daily|weekly|monthly|yearly`) that auto-create next instance on completion.

## Scope
- DB: `is_recurring`, `recurrence_pattern`
- Validation: recurring requires due date
- UI: repeat checkbox + pattern dropdown + recurring badge
- Completion flow creates next instance inheriting metadata
- SG timezone-safe next due date calculation

## Test Plan
- E2E: create daily/weekly, complete recurring todo, verify next instance date + metadata
- Unit: date calculations for all patterns

## Definition of Done
- All four patterns calculate correctly
- Recurrence can be disabled on existing todo
