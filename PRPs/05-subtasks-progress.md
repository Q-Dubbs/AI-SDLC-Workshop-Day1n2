# PRP 05: Subtasks and Progress Tracking

## Feature Overview
Enable nested checklist items under a todo and show real-time completion progress.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 05)
- User behavior reference: USER_GUIDE.md (Section 7)

## User Stories
- As a user, I can break one todo into many subtasks.
- As a user, I can check off subtasks independently.
- As a user, I can monitor progress with visual and text indicators.

## User Flow
1. User expands Subtasks section on a todo.
2. User adds one or more subtasks.
3. User toggles subtask completion state.
4. Progress bar and counts update immediately.
5. Deleting parent todo removes all subtasks.

## Technical Requirements
### Data Model
Create subtasks table with at least:
- id
- todo_id
- title
- completed
- position
- created_at

Constraints:
- Foreign key todo_id references todos.id.
- ON DELETE CASCADE enabled.

### API Contract
- POST /api/todos/[id]/subtasks
- PUT /api/subtasks/[id]
- DELETE /api/subtasks/[id]

### Progress Logic
- completed_count = number of completed subtasks
- total_count = total subtasks
- percent = (completed_count / total_count) * 100, rounded as needed

Display requirements:
- Text: X/Y completed or X/Y subtasks
- Progress bar:
  - blue when percent < 100
  - green when percent = 100

### UI Requirements
- Expand/collapse subtasks section.
- Add subtask input plus add action.
- Checkbox toggle per subtask.
- Delete action per subtask.
- Progress shown even when section is collapsed.

## Edge Cases
- Empty subtask title validation.
- Very long subtask list rendering performance.
- Deleting completed vs incomplete subtasks should recalculate immediately.
- Position ordering maintained after create/delete operations.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Can add multiple subtasks.
- [ ] Can toggle subtask completion.
- [ ] Progress bar updates in real time.
- [ ] Progress percentage and counts are accurate.
- [ ] Deleting parent todo cascades and removes subtasks.

## Testing Requirements
### E2E
- [ ] Expand subtasks section.
- [ ] Add multiple subtasks.
- [ ] Toggle completion and observe progress updates.
- [ ] Delete subtask.
- [ ] Delete parent todo and verify cascade behavior.

### Unit
- [ ] Progress calculation utility tests.
- [ ] Position ordering tests.

## Out of Scope
- Nested subtasks (subtasks of subtasks).
- Drag-and-drop reorder UI.

## Success Metrics
- Subtask actions update UI under 150 ms perceived latency.
- Progress display remains accurate after all CRUD operations.
