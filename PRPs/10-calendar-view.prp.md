# PRP-10: Calendar View

## Objective
Deliver month calendar view with todos and Singapore holidays.

## Scope
- DB: `holidays` seeded with SG holidays
- API: `GET /api/holidays`
- Route: `/calendar`
- Month navigation + today action
- Day rendering with weekend/current day/holiday styling
- Todo badges and day modal
- URL state via `?month=YYYY-MM`

## Test Plan
- E2E: month load, navigation, today button, day modal, holiday display
- Unit: calendar matrix generation logic

## Definition of Done
- Correct rendering of month, holidays, and date-bound todos
