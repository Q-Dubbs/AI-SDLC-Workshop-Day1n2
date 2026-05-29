# PRP-09: Export & Import

## Objective
Enable JSON export/import of todo ecosystem with relation integrity.

## Scope
- API: `GET /api/todos/export`, `POST /api/todos/import`
- UI: export and import actions with feedback
- Versioned JSON format
- Include todos, subtasks, tags, mappings
- Import validation, ID remap, duplicate tag conflict handling

## Test Plan
- E2E: export, import valid, import invalid JSON, data preservation
- Unit: ID remapping, schema validation

## Definition of Done
- Import/export is lossless for supported fields and relationships
