# PRP-05: Subtasks & Progress Tracking

## Objective
Enable subtasks with live progress visualization and cascade-safe deletion.

## Scope
- DB: `subtasks` with `ON DELETE CASCADE`
- API: create/update/delete subtask routes
- UI: expandable section, add input, toggle, delete
- Progress: `completed/total * 100` with text and color state

## Test Plan
- E2E: expand, add multiple, toggle completion, delete subtask, cascade delete
- Unit: progress formula

## Definition of Done
- Unlimited subtasks supported
- Real-time progress display accurate
