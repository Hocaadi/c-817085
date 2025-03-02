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
echo *** IMPORTANT: Supabase Configuration ***
echo You need to manually add your Supabase credentials to the .env file:
echo.
echo VITE_SUPABASE_URL=your_supabase_url
echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
echo # Supabase configuration - ADD YOUR CREDENTIALS HERE
echo # VITE_SUPABASE_URL=your_supabase_url_here
echo # VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
echo.
echo # Feature flags
echo VITE_ENABLE_MOCK_API=false
echo VITE_ENABLE_DEBUG_LOGGING=true
) > .env
echo .env file created successfully.
exit /b 0