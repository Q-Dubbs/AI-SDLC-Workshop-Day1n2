# PRP-02: Priority System

## Objective
Add `high|medium|low` priority with validation, UI controls, sorting, and filtering.

## Scope
- DB `priority` column default `medium`
- Type-level and API validation
- Priority badge colors (light/dark compatible)
- Create/edit priority selector + filter dropdown

## Test Plan
- E2E: create each priority, edit, filter, sort order high→medium→low
- Visual: badge contrast in light/dark mode

## Definition of Done
- Priority is functional end-to-end
- WCAG AA contrast for badges
