# models.py
from django.db import models
from users.models import User


    
class HiveColumn(models.Model):
    guid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=500)
    type = models.CharField(max_length=100)
    position = models.IntegerField(null=True, blank=True)
    owner = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    table_guid = models.CharField(max_length=100, null=True, blank=True)
    table_name = models.CharField(max_length=255, null=True, blank=True)
    created_by = models.CharField(max_length=100)
    updated_by = models.CharField(max_length=100)
    create_time = models.BigIntegerField()
    update_time = models.BigIntegerField()
    classifications = models.JSONField(null=True, blank=True)
    full_json = models.JSONField()


class HiveTable(models.Model):
    guid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=500)
    owner = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    temporary = models.BooleanField(default=False)
    table_type = models.CharField(max_length=100, null=True, blank=True)
    create_time = models.BigIntegerField()
    db_guid = models.CharField(max_length=100, null=True, blank=True)
    db_name = models.CharField(max_length=255, null=True, blank=True)
    created_by = models.CharField(max_length=100)
    updated_by = models.CharField(max_length=100)
    classifications = models.JSONField(null=True, blank=True)
    retention_period = models.IntegerField(blank=True, null=True, help_text="Retention in days")
    full_json = models.JSONField()

class HiveDatabase(models.Model):
    guid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=500)
    location = models.TextField(null=True, blank=True)
    owner = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_by = models.CharField(max_length=100)
    updated_by = models.CharField(max_length=100)
    create_time = models.BigIntegerField()
    update_time = models.BigIntegerField()
    full_json = models.JSONField()



from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class MetadataRecommendation(models.Model):

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField()
    snapshot = GenericForeignKey('content_type', 'object_id')

    field = models.CharField(max_length=100)
    suggested_value = models.TextField()
    confidence = models.FloatField(null=True, blank=True)  # Optional confidence score
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Suggestion for {self.snapshot}.{self.field} → {self.suggested_value}"

