# PRP-14: Deployment on Vercel

## Objective
Deploy Next.js app to Vercel with validated environment variables and production checks.

## Scope
- Build + start verification before deploy
- Set `JWT_SECRET`, `RP_ID`, `RP_NAME`, `RP_ORIGIN`
- CLI and GitHub integration paths
- Add `vercel.json` with region preference (`sin1`)

## Risks
- SQLite reset on deployments in serverless environment

## Exit Criteria
- App accessible over HTTPS
- WebAuthn works on deployed domain
- API and env configuration verified
