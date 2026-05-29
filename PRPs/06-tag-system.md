# PRP 06: Tag System

## Feature Overview
Implement user-managed, color-coded tags and todo-tag relationships for organization and filtering.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 06)
- User behavior reference: USER_GUIDE.md (Section 8)

## User Stories
- As a user, I can create and manage my own tags.
- As a user, I can apply multiple tags to one todo.
- As a user, I can filter todos by selected tag.

## User Flow
1. User opens Manage Tags modal.
2. User creates tag with name and color.
3. User applies one or more tags in create/edit todo forms.
4. Todo displays selected tag pills.
5. User filters by tag using filter controls or badge interaction.

## Technical Requirements
### Data Model
Required tables:
- tags (id, user_id, name, color, created_at)
- todo_tags (todo_id, tag_id)

Constraints:
- Unique tag name per user.
- Cascade behavior for relationship cleanup.

### API Contract
- GET /api/tags
- POST /api/tags
- PUT /api/tags/[id]
- DELETE /api/tags/[id]
- POST /api/todos/[id]/tags
- DELETE /api/todos/[id]/tags

### UI Requirements
- Manage Tags modal with create/edit/delete actions.
- Color picker and optional hex input.
- Tag selector in create/edit todo forms.
- Colored tag badges on todo cards.
- Filter by tag and clear filter action.

### Behavior Rules
- Tag names are user-scoped and case-insensitive unique.
- Editing tag updates appearance on all associated todos.
- Deleting tag removes associations from todos.

## Edge Cases
- Duplicate tag name creation should fail with clear message.
- Invalid color values should be rejected.
- Deleting heavily used tag should remain performant.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Users can create, edit, and delete tags.
- [ ] Multiple tags can be assigned to one todo.
- [ ] Tag badges render with configured colors.
- [ ] Filter by tag shows correct subset.
- [ ] Deleting tag removes it from todos.
- [ ] Duplicate tag names are prevented per user.

## Testing Requirements
### E2E
- [ ] Create tag.
- [ ] Edit tag name and color.
- [ ] Delete tag.
- [ ] Assign multiple tags to todo.
- [ ] Filter by tag.
- [ ] Validate duplicate-name error behavior.

### Unit
- [ ] Tag name validation tests.
- [ ] Color value validation tests.

## Out of Scope
- Shared/global tags across users.
- Hierarchical tags.

## Success Metrics
- Tag CRUD error rate below 1 percent.
- Filter response under 100 ms for common datasets.
