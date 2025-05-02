from django.db import models

from django.db import models
from users.models import User
from django.contrib.postgres.fields import JSONField
from core.models import AnnotationCategory


class AtlasEntity(models.Model):
    guid = models.CharField(max_length=100, unique=True)
    type_name = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=255)
    raw_data = models.JSONField()  # Stores the complete Atlas entity data

    def __str__(self):
        return f"{self.type_name}: {self.name}"

class PendingAnnotation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    entity = models.ForeignKey(AtlasEntity, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(AnnotationCategory, on_delete=models.CASCADE)
    comment = models.TextField(blank=True)
    proposed_changes = models.JSONField()  # Stores proposed metadata changes
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("entity", "user", "category")

class ApprovedAnnotation(models.Model):
    original_request = models.OneToOneField(PendingAnnotation, on_delete=models.CASCADE)
    approved_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approved_annotations')
    date_approved = models.DateTimeField(auto_now_add=True)
    atlas_sync_status = models.BooleanField(default=False)  