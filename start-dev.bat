@echo off
echo Starting Crypto Hub development server...
echo.

REM Set development environment variables
set VITE_SKIP_TS_CHECK=true
set NODE_ENV=development

REM Start the development server
echo Running: npm run dev
npm run dev

pause 