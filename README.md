# Canteen Feedback System

Live site: https://feedback.catalystsolutions.eco

A full-stack feedback management system built with React + TypeScript (frontend) and PHP (backend), hosted on Hostinger.

## Repository Structure

```
wholefeedback/
├── cfs-backend-php/      PHP REST API backend
├── cfs-frontend/         React + TypeScript + Vite frontend
└── .github/
    ├── workflows/        GitHub Actions CI/CD pipelines
    ├── CODEOWNERS        Code review ownership rules
    └── pull_request_template.md
```

## Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|-----------|
| `main` | Production — always reflects live site | production (manual approval) |
| `testing` | QA / staging verification | staging |
| `develop` | Integration — all features merge here first | development |
| `feature/name/task` | Individual developer work | — |
| `hotfix/description` | Emergency production patches | main (fast-track PR) |

## Developer Workflow

```bash
# 1. Start from develop (always up to date)
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/yourname/what-you-are-building

# 3. Build, commit, push
git add .
git commit -m "feat(scope): short description"
git push origin feature/yourname/what-you-are-building

# 4. Open Pull Request → develop on GitHub
```

## Commit Message Format

```
type(scope): short description

Types: feat | fix | hotfix | chore | refactor | docs | style | test
Scope: auth | feedback | admin | db | ui | api | etc.

Examples:
  feat(feedback): add emoji rating to submission form
  fix(auth): resolve JWT expiry on mobile browsers
  hotfix(db): fix null pointer in canteen query
  chore(deps): update react to 19.1.1
```

## Local Development

### Backend
```bash
cd cfs-backend-php
cp .env.example .env
# fill in your local DB credentials in .env
php -S localhost:8000 router.php
```

### Frontend
```bash
cd cfs-frontend
npm install
npm run dev
# → http://localhost:5173
```

## Environment Secrets (GitHub → Settings → Environments)

Each environment (`production`, `staging`, `development`) needs these secrets:

| Secret | Description |
|--------|-------------|
| `HOSTINGER_FTP_HOST` | FTP hostname from Hostinger panel |
| `HOSTINGER_FTP_USER` | FTP username |
| `HOSTINGER_FTP_PASSWORD` | FTP password |
| `HOSTINGER_DEPLOY_PATH_BACKEND` | e.g. `/public_html/api` |
| `HOSTINGER_DEPLOY_PATH_FRONTEND` | e.g. `/public_html` |
| `DB_HOST` | Database host |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | 64-char random hex secret |
| `ADMIN_PASSWORD` | Admin panel password |
| `FRONTEND_URL` | Full URL e.g. `https://feedback.catalystsolutions.eco` |

## Emergency Hotfix

```bash
git checkout main && git pull origin main
git checkout -b hotfix/description-of-fix

# make fix, commit
git push origin hotfix/description-of-fix
# Open PR → main (fast-track approval)

# After merge, sync fix to develop:
git checkout develop
git merge hotfix/description-of-fix
git push origin develop
```

## Rollback Production

```bash
# Find the last good commit
git log --oneline -10

# Revert safely (preserves history)
git checkout main
git revert <bad-commit-hash>
git push origin main
# → triggers auto-deploy of reverted state
```
