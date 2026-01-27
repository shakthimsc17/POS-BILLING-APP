# Git Repository Setup

This document outlines what's included and excluded from the repository.

## Files Included in Git

### Root Level
- `README.md` - Main documentation
- `INSTALLATION_GUIDE.md` - Installation guide
- `setup.sh` - Automated setup script
- `.gitignore` - Git ignore rules
- `.gitattributes` - Line ending normalization

### Backend (`backend/`)
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript config
- `prisma/schema.prisma` - Database schema
- `src/` - All source code
- `.env.example` - Environment template

### Frontend (`frontend/`)
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript configs
- `vite.config.ts` - Vite configuration
- `index.html` - Entry HTML
- `src/` - All source code
- `clothing_categories.csv` - Sample data
- `clothing_items.csv` - Sample data
- `.env.example` - Environment template

### Database (`database/`)
- `init.sql` - Database initialization script

## Files Excluded from Git (via .gitignore)

### Dependencies
- `node_modules/` - All npm packages
- `frontend/node_modules/`
- `backend/node_modules/`

### Environment Files
- `.env` - Actual environment variables (sensitive)
- `.env.local`
- `.env.production`
- `frontend/.env`
- `backend/.env`

**Note:** `.env.example` files ARE included as templates

### Build Artifacts
- `dist/` - Build output directories
- `build/`
- `frontend/dist/`
- `backend/dist/`
- `*.tsbuildinfo`

### Logs
- `*.log` - All log files
- `npm-debug.log*`
- `yarn-debug.log*`

### IDE Files
- `.vscode/`
- `.idea/`
- `*.swp`, `*.swo`

### OS Files
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)

### Database Files
- `*.db`
- `*.sqlite`
- `backend/prisma/migrations/` (generated migrations)

### Vite Cache
- `frontend/.vite/`

## Initial Git Setup Commands

```bash
# Navigate to project root
cd /var/www/html/database/POSBILLING/posbillingapp-local

# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: POS Billing App with Express backend and React frontend"

# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/posbillingapp-local.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Before Pushing Checklist

- [x] `.gitignore` file created and comprehensive
- [x] `.env.example` files exist for both backend and frontend
- [x] No `.env` files are tracked (they contain sensitive data)
- [x] No `node_modules/` directories are tracked
- [x] No build artifacts (`dist/`, `build/`) are tracked
- [x] README.md is up to date
- [x] All source code is included
- [x] Database schema (`prisma/schema.prisma`) is included
- [x] Database initialization script (`database/init.sql`) is included

## Security Notes

⚠️ **IMPORTANT:** Never commit:
- `.env` files (contain passwords, JWT secrets, database URLs)
- `node_modules/` (can be regenerated with `npm install`)
- Build artifacts (can be regenerated)
- Log files (may contain sensitive information)

✅ **Safe to commit:**
- `.env.example` files (templates without real values)
- `package.json` and `package-lock.json` (dependency lists)
- Source code
- Configuration files (without secrets)

## Repository Structure

```
posbillingapp-local/
├── .gitignore          # Git ignore rules
├── .gitattributes      # Line ending normalization
├── README.md           # Main documentation
├── INSTALLATION_GUIDE.md # Installation guide
├── setup.sh            # Setup script
├── backend/            # Express API
│   ├── .env.example    # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   └── src/
├── frontend/           # React app
│   ├── .env.example    # Environment template
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── database/
    └── init.sql        # Database schema
```

