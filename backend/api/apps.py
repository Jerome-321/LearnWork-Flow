from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        """Start the background task scheduler when Django is ready"""
        import logging
        import os
        logger = logging.getLogger(__name__)
        
        # Skip scheduler in production to debug 502 errors
        if os.environ.get('DEBUG') == 'True':
            try:
                from .task_scheduler import start_scheduler
                start_scheduler()
                logger.info("Background task scheduler started")
            except Exception as e:
                logger.error(f"Failed to start scheduler: {str(e)}")
        else:
            logger.info("Scheduler disabled in production")

