# Generated by Django 5.2 on 2025-04-10 00:21

import core.fields
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Credentials',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('atlas_username', models.CharField(max_length=255)),
                ('atlas_password', core.fields.EncryptedTextField()),
                ('ranger_username', models.CharField(max_length=255)),
                ('ranger_password', core.fields.EncryptedTextField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
