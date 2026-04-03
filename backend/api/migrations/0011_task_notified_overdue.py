# Generated migration to add notified_overdue field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_workschedule'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='notified_overdue',
            field=models.BooleanField(default=False),
        ),
    ]
