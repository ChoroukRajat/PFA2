from django.db import models
from users.models import User

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
