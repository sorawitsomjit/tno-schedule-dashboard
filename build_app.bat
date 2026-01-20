@echo off
title Build Telescope Dashboard
echo ==========================================
echo      Building Telescope Dashboard...
echo ==========================================
echo.
cd /d "%~dp0"
call npm run build
echo.
echo ==========================================
echo      Build Complete!
echo ==========================================
pause
