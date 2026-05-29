# PRP-15: Deployment on Railway

## Objective
Deploy app on Railway with persistent storage suitable for SQLite.

## Scope
- Railway CLI setup and project linking
- Environment vars: `JWT_SECRET`, `RP_ID`, `RP_NAME`, `RP_ORIGIN`
- Optional: `railway.json`, `Procfile`, `nixpacks.toml`
- Persistent volume setup and DB path wiring

## Exit Criteria
- App is reachable via HTTPS
- Database persists across requests/deploys (with volume)
- WebAuthn and API routes verified
