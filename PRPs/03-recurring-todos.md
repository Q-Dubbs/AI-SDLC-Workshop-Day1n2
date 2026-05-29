# PRP 03: Recurring Todos

## Feature Overview
Implement recurring todo scheduling so users can automate repeated tasks.

Supported recurrence patterns:
- daily
- weekly
- monthly
- yearly

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 03)
- User behavior reference: USER_GUIDE.md (Section 5)

## User Stories
- As a user, I can mark a todo as recurring and choose a pattern.
- As a user, completing a recurring todo automatically creates the next instance.
- As a user, recurring todos keep context like priority, tags, and reminder offset.

## User Flow
1. User enables Repeat in create/edit form.
2. User selects recurrence pattern and due date.
3. User completes todo.
4. System marks current instance complete and creates next instance.
5. Next instance appears in active list with updated due date.

## Technical Requirements
### Data and Types
- Todo fields required:
  - is_recurring
  - recurrence_pattern
- Type contract: RecurrencePattern = daily | weekly | monthly | yearly.

### Validation
- Recurring todo must have due_date.
- recurrence_pattern required if is_recurring = true.
- Invalid pattern values rejected.

### Completion Behavior
On completion of recurring todo:
- Keep current record as completed.
- Create new todo record with:
  - title copied
  - priority copied
  - reminder_minutes copied
  - recurrence settings copied
  - tag associations copied
  - due_date advanced by pattern

### Date Calculation Rules
- daily: +1 calendar day.
- weekly: +7 calendar days.
- monthly: same day next month, with end-of-month safe handling.
- yearly: same month/day next year, leap year safe handling.
- All calculations use Singapore timezone logic.

### UI Requirements
- Repeat checkbox.
- Recurrence pattern dropdown shown when Repeat is on.
- Recurrence badge shown in list, for example: recurrence weekly.

## Edge Cases
- Completing recurring todo with missing due_date should fail with clear error.
- Monthly rollover must avoid invalid dates (for example 31st into shorter months).
- Rapid repeated completion clicks should not create multiple next instances.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] All four recurrence patterns are supported.
- [ ] Next instance is created when recurring todo is completed.
- [ ] Next instance has correct due date calculation.
- [ ] Priority, tags, reminder, and recurrence metadata are inherited.
- [ ] Recurrence can be disabled on existing todo.

## Testing Requirements
### E2E
- [ ] Create daily recurring todo.
- [ ] Create weekly recurring todo.
- [ ] Complete recurring todo creates next instance.
- [ ] Verify next instance due date for each pattern.
- [ ] Verify inherited metadata on next instance.

### Unit
- [ ] Due date calculator tests for daily/weekly/monthly/yearly.
- [ ] Month-end and leap-year edge case tests.

## Out of Scope
- Custom recurrence rules (for example every 3 days).
- Exclusion dates or holiday skipping.

## Success Metrics
- Recurrence creation success rate above 99 percent.
- No duplicate next-instance records from a single completion event.
