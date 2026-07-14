"""
전체 URL 라우팅.

각 담당 파트는 자기 앱의 urls.py 만 건드리면 됩니다.
  /                  -> 도우미(helper)
  /reservation/           -> 이용자(reservation) 예약 플로우
  /api/accounts/     -> accounts 담당: 회원가입/로그인/뱃지/랭킹 API
  /ws/matching/...   -> matching 담당: config/asgi.py 에서 별도 라우팅 (여기 없음)
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve as serve_media

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.helper.urls")),
    path("reservation/", include("apps.reservation.urls")),
    path("api/accounts/", include("apps.accounts.urls")),
]

# 이용자 스크린샷/프로필 사진 등 업로드 파일(MEDIA_URL)을 서빙한다.
# django.conf.urls.static.static()은 DEBUG=True일 때만 라우팅을 추가하는데,
# 배포 환경은 보안상 DEBUG=False로 켜두기 때문에 그 헬퍼로는 /media/가
# 전혀 서빙되지 않았다(로컬 runserver만 되고 Railway는 전부 404).
# WhiteNoise는 collectstatic 결과물(STATIC)만 서빙하고 업로드 파일(MEDIA)은
# 다루지 않으므로, DEBUG 여부와 무관하게 명시적으로 라우팅을 추가한다.
urlpatterns += [
    path(
        settings.MEDIA_URL.lstrip("/") + "<path:path>",
        serve_media,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
