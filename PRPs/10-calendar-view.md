# PRP 10: Calendar View

## Feature Overview
Provide a monthly calendar view for due-date visualization, planning, and holiday-aware scheduling.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 10)
- User behavior reference: USER_GUIDE.md (Section 12)

## User Stories
- As a user, I can view todos mapped onto calendar dates.
- As a user, I can navigate months and jump back to current month.
- As a user, I can see Singapore public holidays while planning tasks.

## User Flow
1. User navigates to calendar route.
2. Monthly grid displays current or requested month.
3. User browses previous/next months.
4. User clicks a day to inspect todos due on that date.
5. User returns to list view as needed.

## Technical Requirements
### Data Model
- holidays table populated with Singapore holidays.

### API Contract
- GET /api/holidays

### Routing
- Calendar page route: /calendar.
- URL month state query param: month=YYYY-MM.

### Calendar Rendering
- Month grid with Sun-Sat headers.
- Leading/trailing dates rendered for full weeks.
- Current day highlight.
- Weekend styling.
- Holiday name rendering on matching dates.

### Todo Display
- Show todos by due_date on corresponding day cell.
- Show count badge for busy days.
- Color cues by priority.
- Click day opens modal/panel listing that day todos.

### Sync Requirements
- Uses same authenticated todo source as list view.
- Reflects live data changes.

## Edge Cases
- Todos without due_date should not appear in calendar cells.
- Leap year month generation.
- Month transitions across year boundaries.
- Dense day cells with many todos should truncate and provide overflow hint.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Calendar loads current month by default.
- [ ] Prev/next/today navigation works.
- [ ] Todos appear on correct dates.
- [ ] Holidays appear on correct dates.
- [ ] Click day opens detail modal with todos.
- [ ] URL month state works with query parameter.

## Testing Requirements
### E2E
- [ ] Load calendar and verify current month.
- [ ] Navigate to previous and next month.
- [ ] Use today button.
- [ ] Verify todo placement by due date.
- [ ] Verify holiday placement.
- [ ] Open day details from cell click.

### Unit
- [ ] Calendar grid generation tests.
- [ ] Query-param month parser tests.

## Out of Scope
- Week and day timeline views.
- Drag-and-drop rescheduling in calendar.

## Success Metrics
- Month render remains responsive under 300 ms for typical data sizes.
- Date mapping accuracy near 100 percent in timezone-aware tests.
