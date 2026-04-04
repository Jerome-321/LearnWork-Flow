import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client

client = Client()

# Test a simple GET endpoint
response = client.get('/api/')
print(f"GET /api/ -> {response.status_code}")

# Try other endpoints
response = client.get('/healthz')
print(f"GET /healthz -> {response.status_code}")

# Try login POST with empty data
response = client.post('/api/login/', {})
print(f"POST /api/login/ -> {response.status_code}")

# Try register POST with empty data
response = client.post('/api/register/', {})
print(f"POST /api/register/ -> {response.status_code}, Content-Type: {response.get('Content-Type', 'unknown')}")

# Try register with valid data
import json
response = client.post(
    '/api/register/',
    data=json.dumps({'username': 'test', 'email': 'test@test.com', 'password': 'pass'}),
    content_type='application/json'
)
print(f"POST /api/register/ (JSON) -> {response.status_code}")
