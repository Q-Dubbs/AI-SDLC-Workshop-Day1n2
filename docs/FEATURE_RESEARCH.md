# Todo App Feature Research (PRP + Evaluation)

This summary consolidates the 11 feature requirements from `PRPs/README.md` and implementation/verification expectations from `EVALUATION.md`.

## Feature 01: Todo CRUD Operations
- Scope: Create/read/update/delete todos, validation, optimistic UI.
- Data impact: `todos` table (core fields including `title`, `is_completed`, `due_date`, metadata).
- API surface: `POST /api/todos`, `GET /api/todos`, `GET|PUT|DELETE /api/todos/[id]`.
- UI surface: todo form, todo list sections (Overdue/Active/Completed), edit and delete interactions.
- Evaluation anchors: future due-date validation, sectioning, cascade behavior coverage.

## Feature 02: Priority System
- Scope: `high | medium | low`, badge colors, sorting and filtering.
- Data impact: `priority` column on `todos`.
- API surface: validation in todo create/update routes.
- UI surface: priority badge, form dropdown, filter control.
- Evaluation anchors: sorting order, color and accessibility checks.

## Feature 03: Recurring Todos
- Scope: daily/weekly/monthly/yearly recurrence, auto-next-instance on completion.
- Data impact: `is_recurring`, `recurrence_pattern` in `todos`.
- API surface: recurring logic in todo update completion flow.
- UI surface: repeat controls and recurrence indicator.
- Evaluation anchors: correct date generation in Singapore timezone.

## Feature 04: Reminders and Notifications
- Scope: browser notifications with configurable offsets and duplicate prevention.
- Data impact: `reminder_minutes`, `last_notification_sent` in `todos`.
- API surface: `GET /api/notifications/check`.
- UI surface: permission enable action, reminder dropdown, reminder badges.
- Evaluation anchors: polling behavior and one-notification-per-reminder rule.

## Feature 05: Subtasks and Progress Tracking
- Scope: checklist subtasks with progress computation and visual bar.
- Data impact: `subtasks` table linked to `todos` with cascade delete.
- API surface: `POST /api/todos/[id]/subtasks`, `PUT|DELETE /api/subtasks/[id]`.
- UI surface: expandable subtasks panel, progress bar and completion ratio.
- Evaluation anchors: live progress updates and cascade delete test coverage.

## Feature 06: Tag System
- Scope: reusable color-coded labels and todo-tag associations.
- Data impact: `tags` table and join table `todo_tags`.
- API surface: `GET|POST /api/tags`, `PUT|DELETE /api/tags/[id]`, assign/unassign routes under todos.
- UI surface: tag management modal, tag assignment controls, tag badge filtering.
- Evaluation anchors: duplicate prevention and many-to-many consistency.

## Feature 07: Template System
- Scope: save reusable todo templates including subtasks and metadata.
- Data impact: `templates` table with serialized subtask payload.
- API surface: `GET|POST /api/templates`, `PUT|DELETE /api/templates/[id]`, `POST /api/templates/[id]/use`.
- UI surface: save template flow, choose template modal, category filtering.
- Evaluation anchors: due-date offset handling and metadata preservation.

## Feature 08: Search and Filtering
- Scope: real-time case-insensitive search plus combined filters.
- Data impact: query logic over todos and tags.
- API surface: can be client-side if list is hydrated, otherwise server query endpoint.
- UI surface: search box, priority/tag filters, clear-all controls, no-result state.
- Evaluation anchors: debounce and performance target (<100ms for large sets).

## Feature 09: Export and Import
- Scope: JSON backup/restore with relationship preservation.
- Data impact: cross-table serialization and transactional import.
- API surface: `GET /api/todos/export`, `POST /api/todos/import`.
- UI surface: export trigger, import file picker, import result summary.
- Evaluation anchors: ID remapping and tag conflict handling.

## Feature 10: Calendar View
- Scope: monthly calendar with todo due dates and Singapore public holidays.
- Data impact: `holidays` table and due-date projection from todos.
- API surface: `GET /api/holidays`.
- UI surface: `/calendar`, month navigation, day modal, holiday annotations.
- Evaluation anchors: URL month state and accurate day placement.

## Feature 11: Authentication (WebAuthn)
- Scope: passwordless registration/login via passkeys with JWT session cookies.
- Data impact: `users`, `authenticators` tables.
- API surface: register/login options and verify endpoints, session endpoints (`logout`, `me`).
- UI surface: `/login` page and logout actions.
- Evaluation anchors: route protection, 7-day session persistence, secure cookie behavior.

## Cross-Cutting Requirements from Evaluation
- Testing: 11 feature-aligned E2E files plus unit coverage for time, validation, progress, and remapping logic.
- Quality: strict TypeScript, linting, robust API error handling, accessibility and browser compatibility.
- Performance: API response and UI interaction targets.
- Deployment: environment variables, build health, Vercel/Railway readiness, production validation checklist.