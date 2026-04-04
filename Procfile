release: cd backend && python manage.py migrate
web: cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 60
