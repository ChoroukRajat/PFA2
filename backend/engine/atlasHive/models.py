# models.py
from django.db import models
from users.models import User
from django.contrib.postgres.fields import JSONField

class AtlasDataCache(models.Model):
    DATA_TYPES = [
        ('hive_db', 'Hive Database'),
        ('hive_table', 'Hive Table'),
        ('hive_column', 'Hive Column'),
        ('glossary', 'Glossary'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    data_type = models.CharField(max_length=20, choices=DATA_TYPES)
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=255)
    raw_data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)
    is_changed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'data_type')  
        indexes = [
            models.Index(fields=['data_type']),
        ]

    def __str__(self):
        return f"{self.data_type} cache for {self.user}"

    def __str__(self):
        return f"{self.data_type}: {self.name}"

class Annotation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    entity_guid = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=20)
    entity_name = models.CharField(max_length=255)
    term_guid = models.CharField(max_length=100)
    term_name = models.CharField(max_length=255)
    comment = models.TextField(blank=True)
    proposed_changes = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']