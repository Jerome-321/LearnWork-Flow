FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
COPY backend/ ./backend/

RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p backend/media backend/staticfiles

# Set environment for Django
ENV DJANGO_SETTINGS_MODULE=backend.settings
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "cd backend && python manage.py migrate && python manage.py collectstatic --noinput 2>/dev/null || echo 'collectstatic skipped' && python -m gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 60 --access-logfile - --error-logfile -"]
