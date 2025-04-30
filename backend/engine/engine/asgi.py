"""
ASGI config for engine project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""
import dotenv
import os

from django.core.asgi import get_asgi_application


dotenv.load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'engine.settings')

application = get_asgi_application()
