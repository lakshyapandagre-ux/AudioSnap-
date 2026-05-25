@echo off
title AudioSnap Server

echo ===================================================
echo   Starting AudioSnap (Frontend + Backend)
echo ===================================================
echo.
echo NOTE: Do NOT click inside this terminal window!
echo If you click inside, Windows may pause the server 
echo until you press 'Enter'.
echo.
echo Starting up...
cd audiosnap
npm run start
pause
