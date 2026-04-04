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

# Collect static files (with no-input to avoid prompts)
RUN cd backend && python manage.py collectstatic --noinput --clear 2>/dev/null || true

EXPOSE 8000

CMD ["sh", "-c", "cd backend && python manage.py migrate && python -m gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 60 --access-logfile - --error-logfile -"]
