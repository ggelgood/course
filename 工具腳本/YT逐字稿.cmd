@echo off
rem Double-click launcher for yt-transcript.ps1
rem Content is kept ASCII-only on purpose: cmd mangles non-ASCII bytes
rem depending on the active code page. All Chinese text lives in the .ps1.
chcp 65001 >nul
title YT transcript helper
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0yt-transcript.ps1" %*
echo.
pause
