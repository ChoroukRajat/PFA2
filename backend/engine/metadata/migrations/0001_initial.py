# Generated by Django 5.2 on 2025-05-24 02:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='HiveColumn',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guid', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('qualified_name', models.CharField(max_length=500)),
                ('type', models.CharField(max_length=100)),
                ('position', models.IntegerField(blank=True, null=True)),
                ('owner', models.CharField(blank=True, max_length=255, null=True)),
                ('table_guid', models.CharField(blank=True, max_length=100, null=True)),
                ('table_name', models.CharField(blank=True, max_length=255, null=True)),
                ('created_by', models.CharField(max_length=100)),
                ('updated_by', models.CharField(max_length=100)),
                ('create_time', models.BigIntegerField()),
                ('update_time', models.BigIntegerField()),
                ('full_json', models.JSONField()),
            ],
        ),
        migrations.CreateModel(
            name='HiveDatabase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guid', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('qualified_name', models.CharField(max_length=500)),
                ('location', models.TextField(blank=True, null=True)),
                ('owner', models.CharField(blank=True, max_length=255, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_by', models.CharField(max_length=100)),
                ('updated_by', models.CharField(max_length=100)),
                ('create_time', models.BigIntegerField()),
                ('update_time', models.BigIntegerField()),
                ('full_json', models.JSONField()),
            ],
        ),
        migrations.CreateModel(
            name='HiveTable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guid', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('qualified_name', models.CharField(max_length=500)),
                ('owner', models.CharField(blank=True, max_length=255, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('temporary', models.BooleanField(default=False)),
                ('table_type', models.CharField(blank=True, max_length=100, null=True)),
                ('create_time', models.BigIntegerField()),
                ('db_guid', models.CharField(blank=True, max_length=100, null=True)),
                ('db_name', models.CharField(blank=True, max_length=255, null=True)),
                ('created_by', models.CharField(max_length=100)),
                ('updated_by', models.CharField(max_length=100)),
                ('full_json', models.JSONField()),
            ],
        ),
        migrations.CreateModel(
            name='MetadataEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guid', models.CharField(max_length=100, unique=True)),
                ('type_name', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=200)),
                ('qualified_name', models.CharField(blank=True, max_length=500, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('full_json', models.JSONField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='MetadataRecommendation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.PositiveBigIntegerField()),
                ('field', models.CharField(max_length=100)),
                ('suggested_value', models.TextField()),
                ('confidence', models.FloatField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
            ],
        ),
    ]
