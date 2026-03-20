@echo off
REM Automatic Deadline Notification Checker
REM This script runs every 5 minutes to check for upcoming task deadlines

:loop
echo [%date% %time%] Checking for upcoming deadlines...
python manage.py check_deadlines

REM Wait 5 minutes (300 seconds)
timeout /t 300 /nobreak

goto loop
