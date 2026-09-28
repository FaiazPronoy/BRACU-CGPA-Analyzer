@echo off
title CGPA Analyzer - BRACU
cd /d "%~dp0"

echo ==========================================
echo   CGPA ANALYZER  -  BRAC University
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node is not installed. Get Node 20 or later from nodejs.org, then run this again.
  pause
  exit /b 1
)

if exist "node_modules\" goto :ready
echo [1/2] First run: installing packages. This takes a minute or two ...
call npm install
if errorlevel 1 (
  echo [X] npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)
:ready

echo [2/2] Starting CGPA Analyzer at http://localhost:5180
echo       Close this window to stop it.
echo.
rem open the browser a few seconds later, once the server is up
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5180"
call npm run dev
pause
