# Product Requirement Prompts (Based on Evaluation Criteria)

This document defines PRPs for the 11 core features using a consistent structure.

---

## PRP-01: Todo CRUD Operations

### Feature Overview
Implement full todo lifecycle management with validation and sectioned display.

### User Stories
- As a busy professional, I want to quickly create todos with minimal fields.
- As an organizer, I want to edit and delete tasks safely.
- As a planner, I want tasks grouped into Overdue, Active, Completed.

### User Flow
1. User enters title (optional metadata).
2. System validates title and due date.
3. Todo appears in correct section.
4. User edits/toggles/deletes.
5. UI updates optimistically and syncs with API.

### Technical Requirements
- DB: `todos` table with title, due_date, completed, metadata fields.
- API: `POST /api/todos`, `GET /api/todos`, `GET /api/todos/[id]`, `PUT /api/todos/[id]`, `DELETE /api/todos/[id]`.
- Types: `Todo`, `CreateTodoInput`, `UpdateTodoInput`.
- Validation: title non-empty/trimmed, due date in SG timezone and >= now+1m.

### UI Components
- `TodoForm`, `TodoList`, `TodoItem`, `EditTodoModal`, `DeleteConfirmDialog`.

### Edge Cases
- Empty title submission.
- Past due date by timezone mismatch.
- API failure during optimistic update rollback.

### Acceptance Criteria
- CRUD works end-to-end.
- Todos grouped correctly.
- Delete cascades to related records.

### Testing Requirements
- E2E: create (title-only/full), edit, toggle completion, delete, past-date validation.
- Unit: input validation and section grouping logic.

### Out of Scope
- Offline-first sync.
- Multi-user shared lists.

### Success Metrics
- CRUD API success rate > 99%.
- Median create/update latency < 500ms.

---

## PRP-02: Priority System

### Feature Overview
Add priority levels (`high|medium|low`) with sorting and filtering.

### User Stories
- As a user, I want to mark urgent tasks as high priority.
- As a user, I want to filter tasks by priority.

### User Flow
1. User selects priority in create/edit form.
2. Todo displays colored priority badge.
3. User filters list by selected priority.

### Technical Requirements
- DB: `todos.priority` default `medium`.
- API validation for allowed values.
- Types: `type Priority = 'high' | 'medium' | 'low'`.

### UI Components
- `PriorityBadge`, `PrioritySelect`, `PriorityFilter`.

### Edge Cases
- Invalid priority payload.
- Missing priority in legacy records.

### Acceptance Criteria
- Three levels functional.
- Sort order high→medium→low.
- Filter returns only matching priorities.

### Testing Requirements
- E2E: create/edit/filter/sort behaviors.
- Unit: comparator and validator.

### Out of Scope
- Custom priority scales.

### Success Metrics
- Filter interaction response < 100ms for 1000 todos.

---

## PRP-03: Recurring Todos

### Feature Overview
Support recurring tasks that auto-generate next instance upon completion.

### User Stories
- As a habit user, I want daily/weekly/monthly/yearly recurring tasks.

### User Flow
1. User enables recurring and selects pattern.
2. User completes current task.
3. System creates next task with inherited metadata.

### Technical Requirements
- DB: `is_recurring`, `recurrence_pattern`.
- Types: `type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'`.
- Rules: recurring requires due date; SG timezone date math.

### UI Components
- `RecurringToggle`, `RecurrencePatternSelect`, `RecurringBadge`.

### Edge Cases
- Month-end rollover (e.g., Jan 31).
- Leap-year yearly recurrence.

### Acceptance Criteria
- All 4 patterns produce correct next dates.
- Next instance inherits tags/priority/reminder.

### Testing Requirements
- E2E: complete recurring todo creates next.
- Unit: date generation for each pattern.

### Out of Scope
- Custom RRULE expressions.

### Success Metrics
- Recurrence generation correctness = 100% in test suite.

---

## PRP-04: Reminders & Notifications

### Feature Overview
Browser notifications for upcoming due dates with duplicate prevention.

### User Stories
- As a user, I want reminder alerts before due dates.

### User Flow
1. User grants notification permission.
2. User sets reminder lead time.
3. Polling checks due reminders and triggers notification.

### Technical Requirements
- DB: `reminder_minutes`, `last_notification_sent`.
- API: `GET /api/notifications/check`.
- Hook: `useNotifications` polling every 30s.

### UI Components
- `NotificationPermissionButton`, `ReminderSelect`, `ReminderBadge`.

### Edge Cases
- Permission denied.
- Duplicate trigger race conditions.

### Acceptance Criteria
- Notification fires once at correct time.
- Reminder options available and disabled when no due date.

### Testing Requirements
- E2E: reminder setup and badge display.
- Unit: reminder-time computation in SG timezone.
- Manual: permission and browser notification verification.

### Out of Scope
- Push notifications across devices.

### Success Metrics
- Reminder delivery precision within polling interval.

---

## PRP-05: Subtasks & Progress Tracking

### Feature Overview
Allow subtasks per todo with live completion progress.

### User Stories
- As a user, I want to break tasks into smaller steps and track progress.

### User Flow
1. User expands subtasks section.
2. User adds/toggles/deletes subtasks.
3. Progress indicator updates instantly.

### Technical Requirements
- DB: `subtasks` table linked to `todos` with cascade delete.
- API: `POST /api/todos/[id]/subtasks`, `PUT /api/subtasks/[id]`, `DELETE /api/subtasks/[id]`.

### UI Components
- `SubtasksPanel`, `SubtaskItem`, `ProgressBar`.

### Edge Cases
- Zero-subtask progress rendering.
- Rapid toggling consistency.

### Acceptance Criteria
- Unlimited subtasks.
- Accurate `X/Y (Z%)` progress and color states.

### Testing Requirements
- E2E: add/toggle/delete subtasks and cascade behavior.
- Unit: progress calculation.

### Out of Scope
- Nested subtasks.

### Success Metrics
- Progress update perceived instantly (<100ms UI).

---

## PRP-06: Tag System

### Feature Overview
Create and manage colored tags, attach to todos, and filter by tag.

### User Stories
- As a user, I want to categorize todos with reusable tags.

### User Flow
1. User creates/edits/deletes tags in modal.
2. User assigns tags in todo form.
3. Clicking tag badge filters todos.

### Technical Requirements
- DB: `tags`, `todo_tags`.
- API: tags CRUD + assign/unassign endpoints.
- Validation: unique tag name per user.

### UI Components
- `ManageTagsModal`, `TagColorPicker`, `TagBadge`, `TagFilterIndicator`.

### Edge Cases
- Duplicate tag names.
- Deleting tag with many linked todos.

### Acceptance Criteria
- Tag CRUD and assignment work.
- Edit reflects everywhere.

### Testing Requirements
- E2E: full tag lifecycle.
- Unit: uniqueness validation.

### Out of Scope
- Hierarchical tags.

### Success Metrics
- Tag filter accuracy = 100% in tests.

---

## PRP-07: Template System

### Feature Overview
Save todo configurations as templates and instantiate new todos from templates.

### User Stories
- As a user, I want reusable templates for repeated workflows.

### User Flow
1. User clicks Save as Template from todo.
2. User provides template metadata.
3. User chooses template and creates todo.

### Technical Requirements
- DB: `templates` table.
- API: template CRUD + `POST /api/templates/[id]/use`.
- Serialization for subtasks and metadata inheritance.

### UI Components
- `SaveTemplateModal`, `TemplatePickerModal`, `TemplatePreviewCard`.

### Edge Cases
- Template with deleted tags.
- Missing optional metadata in older templates.

### Acceptance Criteria
- Template preserves settings and subtasks.
- Category filtering works.

### Testing Requirements
- E2E: save/use/edit/delete template.
- Unit: serialization and due date offset logic.

### Out of Scope
- Public/shared template marketplace.

### Success Metrics
- Template instantiation success rate > 99%.

---

## PRP-08: Search & Filtering

### Feature Overview
Real-time search and combined filters (AND logic).

### User Stories
- As a user, I want to find tasks quickly by title/tag/priority.

### User Flow
1. User types in search input (debounced).
2. User applies priority/tag filters.
3. UI updates matching results in real-time.

### Technical Requirements
- Debounced search (300ms), case-insensitive.
- Filter engine supports title/tag + priority/tag filters.

### UI Components
- `SearchInput`, `PriorityFilter`, `ActiveFilterChips`, `EmptyResultsState`.

### Edge Cases
- No matches state.
- Very large lists performance.

### Acceptance Criteria
- AND logic for combined filters.
- Clear-all resets to full list.

### Testing Requirements
- E2E: search/filter combinations.
- Unit: filter predicate logic.

### Out of Scope
- Full-text ranking engine.

### Success Metrics
- Filter update < 100ms with 1000 todos.

---

## PRP-09: Export & Import

### Feature Overview
Backup and restore todos via versioned JSON with relationship integrity.

### User Stories
- As a user, I want to export and re-import my data safely.

### User Flow
1. User exports JSON file.
2. User imports file using picker.
3. System validates schema and remaps IDs.

### Technical Requirements
- API: `GET /api/todos/export`, `POST /api/todos/import`.
- Include todos/subtasks/tags/associations and `version` field.
- Conflict rule: reuse existing tags by name.

### UI Components
- `ExportButton`, `ImportFileButton`, `ImportResultToast`.

### Edge Cases
- Invalid JSON/schema mismatch.
- Partial import failure rollback.

### Acceptance Criteria
- Relationships preserved after import.
- Clear success/error messaging.

### Testing Requirements
- E2E: valid/invalid import flows.
- Unit: schema validation + ID remap.

### Out of Scope
- CSV format support.

### Success Metrics
- Import integrity test pass rate 100%.

---

## PRP-10: Calendar View

### Feature Overview
Monthly calendar showing todos on due dates and SG holidays.

### User Stories
- As a planner, I want a calendar view of upcoming tasks and holidays.

### User Flow
1. User opens `/calendar`.
2. User navigates months or jumps to today.
3. User clicks day to see todos.

### Technical Requirements
- DB: `holidays` seeded with SG holidays.
- API: `GET /api/holidays`.
- Route: `/calendar` with `?month=YYYY-MM` state.

### UI Components
- `CalendarGrid`, `MonthNavigator`, `DayCell`, `DayTodosModal`.

### Edge Cases
- Month boundaries with leading/trailing days.
- Days with many todos.

### Acceptance Criteria
- Correct month rendering + holiday/todo display.
- Navigation and day modal function correctly.

### Testing Requirements
- E2E: navigation/today/day modal.
- Unit: calendar matrix generation.

### Out of Scope
- Drag-and-drop calendar scheduling.

### Success Metrics
- Calendar navigation action latency < 200ms.

---

## PRP-11: Authentication (WebAuthn)

### Feature Overview
Passwordless authentication via passkeys with protected sessions.

### User Stories
- As a user, I want secure passkey registration/login without passwords.

### User Flow
1. User opens login page.
2. User registers passkey or logs in with existing passkey.
3. Middleware grants protected app access.
4. User logs out and session ends.

### Technical Requirements
- DB: `users`, `authenticators`.
- API: register options/verify, login options/verify, logout, me.
- Session utility (`createSession`, `getSession`, `deleteSession`).
- HTTP-only cookie, 7-day expiry.

### UI Components
- `LoginCard`, `RegisterPasskeyButton`, `LoginPasskeyButton`, `LogoutButton`.

### Edge Cases
- Unsupported browser WebAuthn behavior.
- RP ID mismatch in production config.

### Acceptance Criteria
- Register/login/logout flows succeed.
- Protected routes redirect unauthenticated users.

### Testing Requirements
- E2E: virtual authenticator register/login/logout/route protection.
- Unit: session token encode/decode and validation.

### Out of Scope
- OAuth/social login providers.

### Success Metrics
- Auth flow completion rate > 98%.
