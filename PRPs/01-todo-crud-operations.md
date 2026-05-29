# PRP 01: Todo CRUD Operations

## Feature Overview
Implement end-to-end todo lifecycle management for authenticated users.

This feature is the foundation for all other features. It must support:
- Create todo
- Read all todos and read one todo
- Update todo fields and completion state
- Delete todo with cascade behavior for related data
- Singapore timezone-safe date handling
- Optimistic UI updates for responsive UX

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 01)
- User behavior reference: USER_GUIDE.md (Sections 2, 4, 13)

## User Stories
- As a user, I can create a todo with only a title so I can quickly capture tasks.
- As a user, I can add due date, priority, recurring settings, and reminder while creating a todo.
- As a user, I can edit and complete todos from the list.
- As a user, I can delete a todo and have related subtasks and tag links removed automatically.

## User Flow
1. User enters title and optional metadata in the create form.
2. User submits form and sees todo immediately (optimistic update).
3. UI refreshes from API and normalizes ordering and computed sections.
4. User can edit, complete/uncomplete, and delete any todo.
5. List is grouped as Overdue, Active, Completed.

## Technical Requirements
### Data Model
Todo table should include at minimum:
- id
- user_id
- title
- completed
- due_date (nullable)
- priority
- is_recurring
- recurrence_pattern
- reminder_minutes
- created_at
- updated_at

### API Contract
- POST /api/todos
- GET /api/todos
- GET /api/todos/[id]
- PUT /api/todos/[id]
- DELETE /api/todos/[id]

### Validation Rules
- Title required after trim.
- Title cannot be whitespace-only.
- Due date must be at least 1 minute in the future (Singapore time).
- All operations are user-scoped by authenticated session.

### Sorting and Sections
- Primary sort: priority (high > medium > low).
- Secondary sort: due date ascending (nulls last).
- Tertiary sort: created_at.
- Display buckets:
  - Overdue: due_date < now and completed = false
  - Active: not completed and not overdue
  - Completed: completed = true

### UI Components
- Create form: title, priority, due date, recurrence, reminder.
- Todo row: completion toggle, badges, due display, edit, delete.
- Edit modal/form.
- Delete action.

## Edge Cases
- Due date provided in local browser timezone must be normalized to Singapore logic.
- Updating due date can move todo between sections.
- Deleting parent todo must remove subtasks and todo_tags associations.
- Double-submit on create should not create duplicates.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Can create todo with title only.
- [ ] Can create todo with priority, due date, recurring, and reminder.
- [ ] API endpoints for create, read all, read one, update, delete are functional.
- [ ] Todos sort correctly by priority and due date.
- [ ] Completed todos move to Completed section.
- [ ] Delete cascades to subtasks and tags.
- [ ] Optimistic UI update behavior implemented.

## Testing Requirements
### E2E
- [ ] Create todo with title only.
- [ ] Create todo with all metadata.
- [ ] Edit todo.
- [ ] Toggle completion.
- [ ] Delete todo.
- [ ] Past due-date validation blocks invalid create/update.

### Unit
- [ ] Validation helper for title.
- [ ] Validation helper for future-due-date check in Singapore timezone.
- [ ] Sorting and sectioning utility tests.

## Out of Scope
- Bulk edits and bulk deletes.
- Drag-and-drop ordering.
- Offline conflict resolution.

## Success Metrics
- CRUD API median response under 300 ms.
- Create/update/delete interaction perceived under 500 ms with optimistic UI.
- Zero data leakage across users.
