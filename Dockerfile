FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
COPY backend/ ./backend/

RUN pip install --no-cache-dir -r requirements.txt

# Set environment for Django
ENV DJANGO_SETTINGS_MODULE=backend.settings
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Test Django startup first
RUN cd backend && python -c "import django; django.setup(); print('Django setup OK')"

# Use PORT from environment if set, otherwise 8000
CMD ["sh", "-c", "cd backend && python manage.py migrate && PORT=${PORT:-8000} && python -m gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 60 --access-logfile - --error-logfile -"]
