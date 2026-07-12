"""
담당자 3(매칭 로직 + 실시간 통신)이 주로 작업할 파일.

- HelperPoolConsumer : 도우미가 로그인한 상태로 대기하는 채널. 새 요청을 broadcast
  로 받고, "accept" 액션을 보내면 원자적으로 배정을 시도한다.
- SessionConsumer     : 매칭이 성사된 뒤 이용자<->도우미가 캔버스/채팅을 주고받는 채널.

프로토콜(예시, 자유롭게 확장 가능):
  클라이언트 -> 서버
    {"action": "accept", "request_id": 3}
    {"action": "draw", "shape": "arrow", "points": [...]}
    {"action": "chat", "message": "여기를 눌러주세요"}
    {"action": "complete"}          # 도우미가 "완료" 버튼을 누름
    {"action": "im_fine"}           # 이용자가 "괜찮아요!" 를 누름

  서버 -> 클라이언트
    {"type": "new_request", "request_id": 3, "screenshot_url": "...", ...}
    {"type": "request_taken", "request_id": 3, "helper_id": 7}
    {"type": "accept_result", "success": true, "request_id": 3}
    {"type": "matched", "helper_name": "홍길동"}
    {"type": "session_message", ...}
"""
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from . import services
from .models import HelpRequest


class HelperPoolConsumer(AsyncJsonWebsocketConsumer):
    group_name = services.HELPERS_GROUP

    async def connect(self):
        user = self.scope.get("user")
        # TODO(담당자 3/4): accounts 쪽 로그인 붙으면 인증 안 된 접속은 막기
        # if not user or not user.is_authenticated:
        #     await self.close()
        #     return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action == "accept":
            await self._handle_accept(content)
        # TODO(담당자 3): "reject"(수동 거절), 도우미 상태 online/offline 토글 등 추가

    async def _handle_accept(self, content):
        request_id = content.get("request_id")
        user = self.scope.get("user")

        help_request, success = await self._try_accept(request_id, user)
        await self.send_json({
            "type": "accept_result",
            "success": success,
            "request_id": request_id,
        })
        if success:
            # 비동기 컨텍스트이므로 services.py 의 동기(async_to_sync) 버전 대신
            # channel_layer.group_send 를 직접 await 한다.
            await self.channel_layer.group_send(
                services.HELPERS_GROUP,
                {
                    "type": "request_taken",
                    "request_id": request_id,
                    "helper_id": getattr(user, "id", None),
                },
            )
            helper_name = getattr(user, "username", "도우미")
            await self.channel_layer.group_send(
                services.session_group_name(request_id),
                {"type": "matched", "helper_name": helper_name},
            )

    @database_sync_to_async
    def _try_accept(self, request_id, user):
        try:
            help_request = HelpRequest.objects.get(pk=request_id)
        except HelpRequest.DoesNotExist:
            return None, False
        success = help_request.try_accept(user)
        return help_request, success

    # --- group_send 로 들어온 이벤트를 그대로 소켓에 전달 ---
    async def new_request(self, event):
        await self.send_json(event)

    async def request_taken(self, event):
        await self.send_json(event)


class SessionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.request_id = self.scope["url_route"]["kwargs"]["request_id"]
        self.group_name = services.session_group_name(self.request_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "complete":
            await self._mark_done()
        elif action == "im_fine":
            await self._cancel()
        else:
            # draw / chat 등은 그대로 세션 그룹 전체(이용자+도우미)에 릴레이
            # TODO(담당자 3): canvas_data 를 HelpRequest 에 주기적으로 저장하고 싶다면
            # 여기서 database_sync_to_async 로 self._save_canvas(content) 호출
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "session_message", "payload": content},
            )

    @database_sync_to_async
    def _get_request(self):
        return HelpRequest.objects.get(pk=self.request_id)

    async def _mark_done(self):
        help_request = await self._get_request()
        await database_sync_to_async(help_request.mark_done)()
        # accounts 앱: HelpRequest.status가 DONE 이 되면 시그널로 효자뱃지 지급
        # (apps/accounts/signals.py 참고)
        await self.channel_layer.group_send(
            self.group_name, {"type": "session_message", "payload": {"action": "completed"}}
        )

    async def _cancel(self):
        help_request = await self._get_request()
        await database_sync_to_async(help_request.cancel)()
        await self.channel_layer.group_send(
            self.group_name, {"type": "session_message", "payload": {"action": "cancelled"}}
        )

    async def matched(self, event):
        await self.send_json(event)

    async def session_message(self, event):
        await self.send_json(event)
