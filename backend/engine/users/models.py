from django.contrib.auth.models import AbstractUser
from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class DataDomain(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='data_domains', null=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('name', 'team')  



class User(AbstractUser):
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, default='admin')
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='members', null=True)
    last_login_date = models.DateField(null=True, blank=True)
    data_domains = models.ManyToManyField(DataDomain, related_name='owners', blank=True)
    
    username = None  
    first_name = models.CharField(max_length=150, blank=True)  
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
   

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
