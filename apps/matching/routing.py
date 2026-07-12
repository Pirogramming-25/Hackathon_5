"""
웹소켓 URL 라우팅 (config/asgi.py 에서 import 해서 사용).

  ws/helpers/            도우미가 접속해 대기 상태가 되고, 새 도움 요청을 broadcast 로 받는 채널
  ws/session/<id>/       매칭이 성사된 이후 이용자<->도우미가 스크린샷/캔버스/채팅을 주고받는 채널
"""
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/helpers/$", consumers.HelperPoolConsumer.as_asgi()),
    re_path(r"^ws/session/(?P<request_id>\d+)/$", consumers.SessionConsumer.as_asgi()),
]
