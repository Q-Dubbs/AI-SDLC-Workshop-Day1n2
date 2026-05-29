# PRP 04: Reminders and Notifications

## Feature Overview
Implement browser-based reminder notifications for todos with due dates.

Reminder offsets:
- 15 minutes
- 30 minutes
- 1 hour
- 2 hours
- 1 day
- 2 days
- 1 week

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 04)
- User behavior reference: USER_GUIDE.md (Section 6)

## User Stories
- As a user, I can enable browser notifications once and receive deadline alerts.
- As a user, I can set reminder lead time per todo.
- As a user, I receive each reminder only once.

## User Flow
1. User enables notifications and grants browser permission.
2. User creates/edits todo with due date and reminder offset.
3. Client polling checks backend for due reminders.
4. Browser notification triggers when reminder condition is met.
5. Reminder is marked sent to prevent duplicates.

## Technical Requirements
### Data Model
Todo fields required:
- reminder_minutes
- last_notification_sent

### API Contract
- GET /api/notifications/check

Endpoint behavior:
- Return authenticated user todos that are due for reminder.
- Ignore completed todos.
- Ignore reminders already sent.
- Return minimal payload for notification rendering.

### Client Behavior
- Implement notification hook in lib/hooks.
- Request Notification permission on user action.
- Poll check endpoint on fixed interval (target 30 seconds, configurable).
- Handle denied permission gracefully.

### Reminder Logic
Reminder trigger time = due_date - reminder_minutes.
Trigger if current Singapore time is at or after trigger time and before due date grace window.

### UI Requirements
- Enable Notifications action button.
- Reminder dropdown in create/edit forms.
- Reminder dropdown disabled when due_date is empty.
- Reminder badge on todo with short label (for example 15m, 1h, 1d).

## Edge Cases
- Browser does not support Notification API.
- Permission denied after user action.
- Polling overlap should not trigger duplicate notifications.
- Timezone drift between client and server must not cause early/late notifications.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Permission request flow works.
- [ ] All seven reminder options available.
- [ ] Notifications fire at correct scheduled time.
- [ ] Duplicate prevention works via last_notification_sent.
- [ ] Singapore timezone handling is correct.

## Testing Requirements
### E2E and Manual
- [ ] Enable notifications and verify permission state.
- [ ] Set reminder and verify badge rendering.
- [ ] Validate API returns todos requiring notification.
- [ ] Verify one-time send behavior.

### Unit
- [ ] Reminder trigger-time calculation tests.
- [ ] Reminder label mapping tests.

## Out of Scope
- Push notifications when browser is closed.
- Email/SMS reminders.
- Snooze workflow.

## Success Metrics
- Reminder false-positive rate near zero.
- Missed reminder rate near zero for active browser sessions.
