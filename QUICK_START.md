# 🚀 Quick Start Guide

## For Non-Technical Users

### Windows Users

1. **Double-click** `START_APP.bat`
2. Wait for two windows to open (Backend and Frontend)
3. Open your browser and go to: **http://localhost:5173**
4. Login with:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

**To Stop:** Close the two windows that opened.

---

### Mac/Linux Users

1. Open Terminal in the project folder
2. Run: `./start.sh`
3. Wait for the message "Application started successfully!"
4. Open your browser and go to: **http://localhost:5173**
5. Login with:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

**To Stop:** Press `Ctrl+C` in the terminal, or run `./stop.sh`

---

## First Time Setup

If this is your first time installing:

1. Make sure you have **Node.js** installed (download from nodejs.org)
2. Make sure **Docker Desktop** is installed and running (if using Docker)
3. Run the setup script:
   ```bash
   npm run setup
   ```
   This will:
   - Install all dependencies
   - Set up the database
   - Create the admin account

4. Then start the app using the Quick Start instructions above.

---

## Troubleshooting

**"Port already in use" error:**
- Close other applications
- Or restart your computer

**"Cannot find module" error:**
- Run: `npm run install:all`

**Database connection error:**
- Make sure Docker is running
- Or check PostgreSQL is installed and running

---

For detailed instructions, see [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)

