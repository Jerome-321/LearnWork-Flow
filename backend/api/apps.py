from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        """Start the background task scheduler when Django is ready"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            from .task_scheduler import start_scheduler
            start_scheduler()
        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}")

