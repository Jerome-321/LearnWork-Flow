import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client

client = Client()

# Test Django's built-in admin
response = client.get('/admin/')
print(f"GET /admin/ -> {response.status_code}")

# Try to access a non-existent route
response = client.get('/nonexistent/')
print(f"GET /nonexistent/ -> {response.status_code}")

# Try accessing just /
response = client.get('/')
print(f"GET / -> {response.status_code}")

# Check what's in the response
print(f"Response content (first 200 chars): {response.content.decode()[:200]}")
