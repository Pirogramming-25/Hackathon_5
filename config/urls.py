"""
전체 URL 라우팅.

각 담당 파트는 자기 앱의 urls.py 만 건드리면 됩니다.
  /                  -> 이용자(reservation) 예약 플로우
  /helper/           -> 도우미(helper) 화면
  /api/accounts/     -> accounts 담당: 회원가입/로그인/뱃지/랭킹 API
  /ws/matching/...   -> matching 담당: config/asgi.py 에서 별도 라우팅 (여기 없음)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.reservation.urls")),
    path("helper/", include("apps.helper.urls")),
    path("api/accounts/", include("apps.accounts.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
