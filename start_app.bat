@echo off
title Start Telescope Dashboard
echo ==========================================
echo      Starting 2.4m Telescope Dashboard
echo      Access at: http://localhost:3000
echo ==========================================
echo.
cd /d "%~dp0"
call npm start
pause
