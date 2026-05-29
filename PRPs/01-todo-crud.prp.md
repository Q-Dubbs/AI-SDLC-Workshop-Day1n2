# PRP-01: Todo CRUD Operations

## Objective
Implement full todo CRUD with validation, sectioned UI, and optimistic updates.

## Scope
- API: `POST/GET /api/todos`, `GET/PUT/DELETE /api/todos/[id]`
- Validation: non-empty trimmed title, SG timezone due date, due date >= now + 1 minute
- UI: create form, edit form/modal, delete confirm, completion toggle
- Display groups: Overdue, Active, Completed

## Deliverables
- Database schema and migrations for todo core fields
- API routes with error handling and validation
- UI components wired to API with optimistic update behavior
- Sorting by priority then due date

## Test Plan
- E2E: create (title-only), create (full metadata), edit, toggle completion, delete, past due date rejection

## Definition of Done
- User can create/update/read/delete todos reliably
- Completed todos appear in Completed group
- Delete cascades to subtasks and tag links
