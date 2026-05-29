# PRP 09: Export and Import

## Feature Overview
Provide backup and restore capabilities with robust data validation and relationship preservation.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 09)
- User behavior reference: USER_GUIDE.md (Section 11)

## User Stories
- As a user, I can export my todos to keep backups.
- As a user, I can import previous backups into my account.
- As a user, I can trust that relationships and metadata are preserved.

## User Flow
1. User exports current data.
2. User stores backup file.
3. User imports backup file later.
4. System validates payload and creates mapped records.
5. User receives clear success/error feedback.

## Technical Requirements
### API Contract
- GET /api/todos/export
- POST /api/todos/import

### Export Format
Required JSON payload sections:
- version
- todos
- subtasks
- tags
- associations (todo_tags or equivalent)

Optional extension from USER_GUIDE:
- CSV export for spreadsheet analysis (non-importable)

### Import Validation
- Validate file is well-formed JSON.
- Validate required top-level fields.
- Validate required todo fields and enum values.
- Reject malformed relationships.

### Import Mapping Logic
- Remap imported IDs to new local IDs.
- Reconnect subtasks and tag associations using map tables.
- Resolve tag-name conflicts by reusing existing tag for same user when names match.

### UI Requirements
- Export action button.
- Import action with file picker.
- Success message includes imported counts.
- Clear error messaging for invalid files.

## Edge Cases
- Importing very old version payloads.
- Duplicate imports creating repeated records.
- Partial data corruption in one section (for example tags valid, subtasks invalid).

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Export creates valid JSON with version field.
- [ ] Import validates schema and required fields.
- [ ] IDs are remapped correctly.
- [ ] Relationships between todos, subtasks, tags are preserved.
- [ ] Tag conflicts are handled without duplicate tag creation.
- [ ] Success/error messages are clear.

## Testing Requirements
### E2E
- [ ] Export todos.
- [ ] Import valid backup.
- [ ] Import invalid JSON and verify error path.
- [ ] Verify imported todos appear immediately.
- [ ] Verify metadata and relationships preserved.

### Unit
- [ ] ID remapping utility tests.
- [ ] Import schema validator tests.
- [ ] Tag conflict resolution tests.

## Out of Scope
- Automatic merge/conflict resolution across multiple backups.
- Incremental sync protocol.

## Success Metrics
- Import success rate above 99 percent for valid files.
- Zero orphaned subtasks and zero orphaned tag relationships post-import.
