#!/bin/bash
# Automatic Deadline Notification Checker
# This script runs every 5 minutes to check for upcoming task deadlines

while true; do
    echo "[$(date)] Checking for upcoming deadlines..."
    python manage.py check_deadlines
    
    # Wait 5 minutes (300 seconds)
    sleep 300
done
