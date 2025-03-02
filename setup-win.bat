@echo off
echo ========================================================
echo   Crypto Hub - Development Environment Setup (Windows)
echo ========================================================
echo.

echo Setting up development environment variables...
call :create_env_file

echo Installing dependencies...
npm install

echo.
echo Setup complete! You can now run the development server with:
echo npm run dev
echo.
echo Or use the start-dev.bat script for convenience.
echo.
pause
exit /b 0

:create_env_file
echo Creating .env file...
(
echo # Environment
echo NODE_ENV=development
echo.
echo # Skip TypeScript type checking during build
echo TSC_COMPILE_ON_ERROR=true
echo VITE_SKIP_TS_CHECK=true
echo ESLINT_NO_DEV_ERRORS=true
echo.
echo # API configuration
echo VITE_API_URL=https://api.india.delta.exchange
echo VITE_WEBSOCKET_URL=wss://ws.india.delta.exchange
echo.
echo # Feature flags
echo VITE_ENABLE_MOCK_API=false
echo VITE_ENABLE_DEBUG_LOGGING=true
) > .env
echo .env file created successfully.
exit /b 0 