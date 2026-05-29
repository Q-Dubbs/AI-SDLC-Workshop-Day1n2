# Proposed Project Structure

This structure maps directly to the 11 PRP features and the `EVALUATION.md` checklist.

```text
AI-SDLC-Workshop-Day1n2/
  app/
    api/
      auth/
        register-options/route.ts
        register-verify/route.ts
        login-options/route.ts
        login-verify/route.ts
        logout/route.ts
        me/route.ts
      holidays/route.ts
      notifications/check/route.ts
      subtasks/[id]/route.ts
      tags/
        route.ts
        [id]/route.ts
      templates/
        route.ts
        [id]/route.ts
        [id]/use/route.ts
      todos/
        route.ts
        [id]/route.ts
        [id]/subtasks/route.ts
        [id]/tags/route.ts
        export/route.ts
        import/route.ts
    calendar/page.tsx
    login/page.tsx
    error.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx
  components/
    auth/LoginForm.tsx
    calendar/CalendarGrid.tsx
    shared/PriorityBadge.tsx
    shared/SearchFilters.tsx
    tags/TagManager.tsx
    templates/TemplateManager.tsx
    todos/SubtaskList.tsx
    todos/TodoForm.tsx
    todos/TodoList.tsx
  lib/
    auth.ts
    db.ts
    timezone.ts
    validations.ts
    hooks/useNotifications.ts
  scripts/
    seed-holidays.ts
  tests/
    helpers.ts
    01-todo-crud.spec.ts
    02-priority-system.spec.ts
    03-recurring-todos.spec.ts
    04-reminders-notifications.spec.ts
    05-subtasks-progress.spec.ts
    06-tag-system.spec.ts
    07-template-system.spec.ts
    08-search-filtering.spec.ts
    09-export-import.spec.ts
    10-calendar-view.spec.ts
    11-authentication-webauthn.spec.ts
  docs/
    FEATURE_RESEARCH.md
    PROJECT_STRUCTURE.md
  .env.example
  .gitignore
  eslint.config.mjs
  middleware.ts
  next.config.ts
  package.json
  playwright.config.ts
  postcss.config.mjs
  tsconfig.json
```

## Feature-to-Directory Mapping
- Feature 01 (CRUD): `app/api/todos`, `components/todos`, `app/page.tsx`.
- Feature 02 (Priority): `components/shared/PriorityBadge.tsx`, todo API validation.
- Feature 03 (Recurring): `app/api/todos/[id]/route.ts`, `lib/timezone.ts`, todo UI forms.
- Feature 04 (Notifications): `lib/hooks/useNotifications.ts`, `app/api/notifications/check/route.ts`.
- Feature 05 (Subtasks): `app/api/todos/[id]/subtasks`, `app/api/subtasks/[id]`, `components/todos/SubtaskList.tsx`.
- Feature 06 (Tags): `app/api/tags`, `app/api/todos/[id]/tags`, `components/tags/TagManager.tsx`.
- Feature 07 (Templates): `app/api/templates`, `components/templates/TemplateManager.tsx`.
- Feature 08 (Search): `components/shared/SearchFilters.tsx`, todo list rendering logic in `app/page.tsx`.
- Feature 09 (Export/Import): `app/api/todos/export`, `app/api/todos/import`.
- Feature 10 (Calendar): `app/calendar/page.tsx`, `components/calendar/CalendarGrid.tsx`, `app/api/holidays/route.ts`.
- Feature 11 (Auth): `app/api/auth/*`, `lib/auth.ts`, `middleware.ts`, `app/login/page.tsx`.

## Evaluation Alignment
- Testing checklist: mapped under `tests/` by feature number.
- Quality checklist: TypeScript, ESLint, route-level error handling stubs.
- Deployment checklist: `.env.example`, runtime scripts in `package.json`.