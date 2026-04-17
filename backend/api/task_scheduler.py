"""
Task Scheduler - Manages background jobs for deadline checking and notifications
Uses APScheduler to run periodic tasks
"""

from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


def start_scheduler():
    """Start the background task scheduler"""
    scheduler = BackgroundScheduler()
    
    # 🔴 Overdue & upcoming deadline checker - runs every 5 minutes
    scheduler.add_job(
        run_deadline_check,
        'interval',
        minutes=5,
        id='check_deadlines_job',
        name='Check deadlines and notify users',
        replace_existing=True,
        misfire_grace_time=60
    )
    
    if not scheduler.running:
        scheduler.start()
        logger.info("✅ Background task scheduler started")
    else:
        logger.info("⚠️ Scheduler already running")


def run_deadline_check():
    """Run the deadline checking command"""
    try:
        logger.info("[SCHEDULER] Running deadline check...")
        call_command('check_deadlines')
        logger.info("[SCHEDULER] Deadline check completed successfully")
    except Exception as e:
        logger.error(f"[SCHEDULER] Error running deadline check: {str(e)}")


def stop_scheduler():
    """Stop the background task scheduler"""
    # This is handled by Django shutdown, but here for reference
    pass
