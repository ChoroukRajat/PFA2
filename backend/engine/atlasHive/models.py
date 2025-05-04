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
    entity_guid = models.CharField(max_length=100, null=True)
    entity_type = models.CharField(max_length=20, null=True)
    entity_name = models.CharField(max_length=255, null=True)
    term_guid = models.CharField(max_length=100, null=True)
    term_name = models.CharField(max_length=255, null=True)
    comment = models.TextField(blank=True)
    proposed_changes = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class PersonalGlossary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Personal Glossaries"
        ordering = ['-created_at']
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} (User: {self.user.username})"

class PersonalGlossaryTerm(models.Model):
    glossary = models.ForeignKey(PersonalGlossary, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('glossary', 'name')

    def __str__(self):
        return f"{self.name} (Glossary: {self.glossary.name})"

class PersonalAnnotation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    entity_guid = models.CharField(max_length=100,null=True)
    entity_type = models.CharField(max_length=20,null=True)
    entity_name = models.CharField(max_length=255,null=True)
    term = models.ForeignKey(PersonalGlossaryTerm, on_delete=models.CASCADE)
    comment = models.TextField(blank=True)
    proposed_changes = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entity_name} annotated with {self.term.name}"