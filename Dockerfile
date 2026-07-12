FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# psycopg2 빌드에 필요한 패키지
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Railway 등은 컨테이너가 리슨해야 할 포트를 PORT 환경변수로 내려준다(고정 아님).
# 로컬 docker-compose 는 PORT 를 안 주므로 기본값 8000 사용.
# 배포 시 migrate/collectstatic 을 매번 자동 실행해서 "마이그레이션 깜빡함" 사고를 방지한다.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
