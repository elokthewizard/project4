# Generated by Django 3.2.19 on 2024-10-09 21:09

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_auto_20241009_0059'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='followed_by',
            field=models.ManyToManyField(blank=True, related_name='followed_by_users', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='user',
            name='following',
            field=models.ManyToManyField(blank=True, related_name='following_users', to=settings.AUTH_USER_MODEL),
        ),
    ]
