from django.db import models
from users.models import User, Team

class Credentials(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)  
    atlas_username = models.CharField(max_length=255,null=True, blank=True)
    atlas_password = models.CharField(max_length=255,null=True, blank=True)  # Use EncryptedTextField for sensitive data
    ranger_username = models.CharField(max_length=255,null=True, blank=True)
    ranger_password = models.CharField(max_length=255,null=True, blank=True)  # Store the Ranger password encrypted

    def __str__(self):
        return f"Credentials for {self.user.first_name}"



class File(models.Model):
    file_name = models.CharField(max_length=255)  
    file_id = models.CharField(max_length=255, unique=True)  
    user = models.ForeignKey(User, on_delete=models.CASCADE)  
    date_uploaded = models.DateTimeField(auto_now_add=True)
    atlas_entity_name = models.CharField(max_length=255, blank=True, null=True)  

    def __str__(self):
        return f"{self.file_name} ({self.file_id})"

class FileAction(models.Model):
    source_file = models.ForeignKey(File, related_name="source_file", on_delete=models.CASCADE)
    new_file = models.ForeignKey(File, related_name="new_file", on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True)

    def __str__(self):
        return f"Action on {self.source_file.file_name} at {self.date}"

class Metadata(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="metadata")
    column_name = models.CharField(max_length=255)
    data_type = models.CharField(max_length=100)
    missing_percentage = models.FloatField(null=True, blank=True)
    is_outlier_present = models.BooleanField(default=False)
    suggested_type = models.CharField(max_length=100, null=True, blank=True)
    normalization = models.CharField(max_length=100, null=True, blank=True)
    pattern_detected = models.JSONField(default=list)
    semantic_cluster = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        unique_together = ("file", "column_name")

class AnnotationCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    label = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.label} ({self.user.team.name})"

class ColumnAnnotation(models.Model):
    metadata = models.ForeignKey(Metadata, on_delete=models.CASCADE, related_name="annotations")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(AnnotationCategory, on_delete=models.CASCADE)
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)  
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("metadata", "user")


