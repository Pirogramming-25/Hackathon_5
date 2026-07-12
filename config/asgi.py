"""
ASGI config for config project.

HTTP는 Django가 그대로 처리하고, /ws/ 로 들어오는 웹소켓 요청은
apps.matching.routing 에 정의된 consumer 로 넘긴다.
(매칭/실시간 통신 담당자는 apps/matching/routing.py 와 consumers.py 를 수정하면 됨)
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Django 앱 레지스트리를 먼저 초기화한 뒤에 채널 라우팅을 임포트해야 한다.
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from apps.matching import routing as matching_routing  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(matching_routing.websocket_urlpatterns)
        ),
    }
)
