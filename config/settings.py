"""
효도클릭(HyoClick) 프로젝트 설정

4개 담당 파트가 이 하나의 Django 프로젝트 위에서 각자 앱을 개발합니다.
  - apps.reservation : 1. 이용자(User) 프론트
  - apps.helper       : 2. 도우미(Helper) 프론트
  - apps.matching     : 3. 매칭 로직 + 실시간 통신 (Channels)
  - apps.accounts     : 4. 백엔드/인프라 (인증, 뱃지·랭킹 API)
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-in-.env-before-deploy",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    "daphne",  # ASGI 서버. INSTALLED_APPS 맨 위에 있어야 runserver가 ASGI로 뜸
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "channels",
    # 담당 파트별 앱
    "apps.reservation",
    "apps.helper",
    "apps.matching",
    "apps.accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Railway 등에 배포 시 정적파일(css/js) 서빙
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# 일반 HTTP는 WSGI, 웹소켓은 ASGI(Channels)가 처리
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ---------------------------------------------------------------------------
# Database
#   우선순위:
#   1) DATABASE_URL 이 있으면 그걸 사용 (Railway/Render/Heroku가 Postgres
#      플러그인을 붙이면 자동으로 넣어주는 표준 환경변수)
#   2) POSTGRES_DB 등 개별 변수가 있으면 그걸로 조립 (로컬 docker-compose용)
#   3) 둘 다 없으면 sqlite (아무 설정 없이 바로 실행하는 로컬 개발용)
# ---------------------------------------------------------------------------
import dj_database_url

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

if os.environ.get("DATABASE_URL"):
    DATABASES["default"] = dj_database_url.parse(
        os.environ["DATABASE_URL"], conn_max_age=600
    )
elif os.environ.get("POSTGRES_DB"):
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "hyoclick"),
        "USER": os.environ.get("POSTGRES_USER", "hyoclick"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "hyoclick"),
        "HOST": os.environ.get("POSTGRES_HOST", "db"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }


# ---------------------------------------------------------------------------
# Channels (실시간 매칭/채팅/캔버스 동기화)
#   - REDIS_URL이 설정되어 있으면(docker-compose) Redis 채널 레이어 사용
#   - 없으면(로컬 단독 실행) 메모리 채널 레이어로 대체 — redis 없이도 개발 가능
# ---------------------------------------------------------------------------

REDIS_URL = os.environ.get("REDIS_URL")

if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "ko-kr"
TIME_ZONE = "Asia/Seoul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
# whitenoise가 collectstatic 결과물을 직접 서빙 (Railway엔 별도 CDN/nginx가 없어서 필요)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# 이용자 화면 스크린샷(HelpRequest.screenshot) 저장 위치.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# 로그인 관련 (도우미 전용 로그인. 이용자는 로그인 없이 세션만 사용)
LOGIN_URL = "helper:login"
LOGIN_REDIRECT_URL = "helper:waiting"
LOGOUT_REDIRECT_URL = "helper:login"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.CsrfExemptSessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}
