import requests

url = "http://127.0.0.1:8000/api/ai/analyze/"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzczNzUzODg2LCJpYXQiOjE3NzM2Njc0ODYsImp0aSI6Ijc2N2I2ZjQyNmY0NDRkOTQ5ZGRhY2VjYWY1NzA0MjUzIiwidXNlcl9pZCI6IjMifQ.IrbHEQ_0SJg5q9VN-R6kdGFgZOFHV8B3xuNvlw6KhOA"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

data = {
    "title": "Algorithm homework",
    "description": "Implement quicksort",
    "category": "study",
    "priority": "high"
}

response = requests.post(url, json=data, headers=headers)

print("Status:", response.status_code)
print("Response text:")
print(response.text)