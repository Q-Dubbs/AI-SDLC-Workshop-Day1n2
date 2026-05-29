# PRP-13: Performance & Optimization

## Objective
Meet frontend/backend/database performance targets defined in evaluation criteria.

## Targets
- Load time < 2s, TTI < 3s, FCP < 1s
- Todo operations < 500ms
- Search/filter < 100ms
- API average < 300ms
- Bundle < 500KB gzipped

## Scope
- Query/index optimization (`user_id`, foreign keys, `due_date`)
- Prevent N+1 patterns and use prepared statements
- Optional virtualization/lazy rendering for large todo lists
- Profiling and regression checks

## Exit Criteria
- Metrics met in local production and hosted environment
