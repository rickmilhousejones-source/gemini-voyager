@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   Gemini Voyager - Chrome Dev Build
echo ========================================
echo   Output folder: dist_chrome
echo   First load: chrome://extensions/ - Load unpacked
echo   Wait for: [OK] Build complete -^> dist_chrome
echo   REQUIRED: Reload extension at chrome://extensions after each [OK]
echo   Then refresh Gemini page
echo   Stop watcher: Ctrl+C
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Please install Node.js first.
  pause
  exit /b 1
)

call npm run dev:chrome
set EXIT_CODE=%ERRORLEVEL%

if not %EXIT_CODE%==0 (
  echo.
  echo [ERROR] Dev build failed, exit code: %EXIT_CODE%
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
