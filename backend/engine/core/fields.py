from django.db import models
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

class EncryptedTextField(models.TextField):
    def __init__(self, *args, **kwargs):
        self.fernet = Fernet(settings.FERNET_SECRET_KEY.encode())  # Use the key from settings
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            return self.fernet.decrypt(value.encode()).decode()  # Decrypt value when retrieving from the database
        except InvalidToken:
            return value  # If decryption fails, return value as is (fallback)

    def get_prep_value(self, value):
        if value is None:
            return value
        return self.fernet.encrypt(value.encode()).decode()  # Encrypt value before saving to the database
