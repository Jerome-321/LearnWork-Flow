import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
import json

client = Client()

# Test 1: with JSON
print("=== TEST 1: JSON data ===")
response = client.post(
    '/api/register/',
    data=json.dumps({
        'username': 'shelltest123',
        'email': 'shelltest123@example.com',
        'password': 'password123'
    }),
    content_type='application/json'
)

print(f"Status: {response.status_code}")
print(f"Response: {response.content.decode()[:500]}")

# Test 2: Regular dict
print("\n=== TEST 2: Regular post data ===")
response = client.post(
    '/api/register/',
    {
        'username': 'shelltest456',
        'email': 'shelltest456@example.com',
        'password': 'password123'
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {response.content.decode()[:500]}")
