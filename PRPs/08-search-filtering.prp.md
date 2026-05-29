# PRP-08: Search & Filtering

## Objective
Provide real-time search and multi-filter logic with performant updates.

## Scope
- Search input (debounced 300ms, case-insensitive)
- Match todo titles and optionally tag names
- Priority and tag filters
- Combined filters with AND logic
- Clear-all filters and empty-state UI

## Test Plan
- E2E: search title/tag, priority filter, tag filter, combined filters, clear
- Performance: 1000 todos filter < 100ms

## Definition of Done
- Filters combine correctly and update results in real time
