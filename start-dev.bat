@echo off
echo ========================================================
echo   Crypto Hub - Starting Development Server
echo ========================================================
echo.

if not exist .env (
  echo Environment file (.env) not found. Running setup first...
  call setup-win.bat
)

echo Starting development server...
echo.
echo When the server starts, access the app at:
echo http://localhost:8080
echo.
echo NOTE: Do NOT use '/c-817085/' in your local URL
echo.
npm run dev 