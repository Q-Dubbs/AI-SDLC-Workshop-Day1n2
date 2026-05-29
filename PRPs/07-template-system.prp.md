# PRP-07: Template System

## Objective
Allow users to save todos as templates and create new todos from templates.

## Scope
- DB: `templates` table
- API: templates CRUD + `POST /api/templates/[id]/use`
- UI: save-as-template + use-template modals
- Include metadata + subtasks JSON serialization + due date offset handling

## Test Plan
- E2E: save template, create from template, edit/delete template
- Unit: subtasks JSON serialization/deserialization

## Definition of Done
- Template-generated todos preserve configured metadata and subtasks
