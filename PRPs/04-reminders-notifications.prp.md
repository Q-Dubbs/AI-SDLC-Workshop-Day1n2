# PRP-04: Reminders & Notifications

## Objective
Deliver browser reminder notifications with duplicate prevention and SG timezone correctness.

## Scope
- DB: `reminder_minutes`, `last_notification_sent`
- Hook: `useNotifications` polling every 30s
- API: `GET /api/notifications/check`
- UI: enable notifications button + 7-option reminder dropdown
- Reminder dropdown disabled unless due date exists

## Test Plan
- Manual: permission flow + real notification timing
- E2E: reminder set/display/API behavior
- Unit: reminder time calculation in SG timezone

## Definition of Done
- Notification fires once at correct time
- All timing options available
