# Generated by Django 5.2 on 2025-05-01 23:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_datadomain_team_alter_datadomain_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
