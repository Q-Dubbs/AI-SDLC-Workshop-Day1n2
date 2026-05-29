# PRP 07: Template System

## Feature Overview
Allow users to save reusable todo blueprints and create new todos from templates with minimal input.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 07)
- User behavior reference: USER_GUIDE.md (Section 9)

## Scope Clarification
If documentation conflicts, evaluation requirements take priority for implementation completeness.

Example conflict:
- USER_GUIDE includes a note that subtasks may not be saved in templates.
- EVALUATION requires subtasks JSON serialization and recreation from template.

Target behavior for this PRP: include subtasks support.

## User Stories
- As a user, I can save a frequently used todo configuration as a template.
- As a user, I can apply a template to instantly create a new todo.
- As a user, I can organize templates by category and manage them over time.

## User Flow
1. User fills todo form with reusable settings.
2. User clicks Save as Template and provides name/description/category.
3. User later selects template from dropdown or template manager.
4. System creates a new todo with template defaults.
5. User can delete or edit templates without affecting existing todos.

## Technical Requirements
### Data Model
Create templates table with at least:
- id
- user_id
- name
- description
- category
- title_template
- priority
- is_recurring
- recurrence_pattern
- reminder_minutes
- subtasks_json
- due_date_offset_minutes
- created_at
- updated_at

### API Contract
- GET /api/templates
- POST /api/templates
- PUT /api/templates/[id]
- DELETE /api/templates/[id]
- POST /api/templates/[id]/use

### Template Use Logic
When using a template:
- Create new todo with template fields.
- Calculate due_date from due_date_offset_minutes if configured.
- Recreate subtasks from subtasks_json.
- Associate todo with current user.

### UI Requirements
- Save as Template action from todo form.
- Save template modal (name required, description/category optional).
- Use Template dropdown or modal listing.
- Category filter in template selection UI.
- Template preview of key settings.

## Edge Cases
- Empty template name should fail validation.
- Invalid subtasks_json should not break template list; show safe fallback.
- Deleting template should not alter existing todos created from it.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] User can save a todo as template.
- [ ] Templates persist metadata (priority, recurrence, reminder, category).
- [ ] User can create new todo from template.
- [ ] Subtasks are serialized and recreated from template.
- [ ] Category filtering works in template selection UI.
- [ ] Template delete/edit actions function correctly.

## Testing Requirements
### E2E
- [ ] Save todo as template.
- [ ] Create todo using template.
- [ ] Verify settings are preserved.
- [ ] Verify subtasks are created from serialized data.
- [ ] Edit template.
- [ ] Delete template.

### Unit
- [ ] Subtasks JSON serialization/deserialization tests.
- [ ] Due date offset calculation tests.

## Out of Scope
- Team-shared templates.
- Version history for template revisions.

## Success Metrics
- Template apply flow completes in under 2 clicks for common usage.
- Template-created todo fidelity matches template configuration above 99 percent.
