# PRP-06: Tag System

## Objective
Implement tag CRUD, assignment, and click-to-filter behavior.

## Scope
- DB: `tags`, `todo_tags`
- API: tags CRUD + todo tag attach/detach
- UI: manage tags modal, color picker, tag selection in todo form
- Todo cards show colored badges; badge click filters list

## Test Plan
- E2E: create/edit/delete tag, assign multiple tags, filter by tag, duplicate name validation
- Unit: tag name validation

## Definition of Done
- Tags unique per user
- Edits propagate to linked todos
- Deletion removes associations safely
