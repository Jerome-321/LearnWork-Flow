from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import CustomUser


class Command(BaseCommand):
    help = 'Clean up unverified user accounts older than 15 minutes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        # Delete unverified users older than 15 minutes
        cutoff_time = timezone.now() - timedelta(minutes=15)
        
        unverified_users = CustomUser.objects.filter(
            is_verified=False,
            date_joined__lt=cutoff_time
        )

        count = unverified_users.count()
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} unverified user accounts')
            )
            for user in unverified_users:
                self.stdout.write(f'  - {user.email} (joined: {user.date_joined})')
        else:
            deleted_count, _ = unverified_users.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} unverified user accounts')
            )