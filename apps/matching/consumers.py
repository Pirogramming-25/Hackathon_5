"""
3. 매칭 로직 + 실시간 통신 담당.

routing.py 가 아래 두 클래스를 ws/helpers/, ws/session/<id>/ 에 연결해두었으니
클래스 이름/경로는 그대로 두고 내용만 채우면 됩니다. (Channels 공식 문서:
https://channels.readthedocs.io/ 의 AsyncJsonWebsocketConsumer 참고)

프로토콜은 자유롭게 정해도 되지만, 다른 담당자들과 아래 정도는 미리 맞춰두는 걸
추천합니다.
  - 클라이언트 -> 서버: {"action": "accept", "request_id": N} 같은 형태
  - 서버 -> 클라이언트: {"type": "new_request", ...} 같은 형태
정하고 나면 이 파일 위에 프로토콜을 문서화해두세요.
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from . import services
from .models import HelpRequest


class HelperPoolConsumer(AsyncJsonWebsocketConsumer):
    """
    로그인한 도우미가 접속하는 공용 대기 채널.

    클라이언트 -> 서버

    요청 수락:
    {
        "action": "accept",
        "request_id": 1
    }

    서버 -> 클라이언트

    새 도움 요청:
    {
        "type": "new_request",
        "request_id": 1,
        "reservation_step": "날짜 선택",
        "screenshot_url": "..."
    }

    수락 결과:
    {
        "type": "accept_result",
        "success": true,
        "request_id": 1
    }

    다른 도우미가 먼저 수락:
    {
        "type": "request_taken",
        "request_id": 1
    }
    """

    group_name = services.HELPERS_GROUP

    async def connect(self):
        user = self.scope.get("user")

        # 도우미는 로그인한 상태여야 대기방에 접속할 수 있음
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send_json(
            {
                "type": "connected",
                "message": "도우미 대기방에 연결되었습니다.",
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name,
        )

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "accept":
            await self._handle_accept(content)
            return

        await self.send_json(
            {
                "type": "error",
                "message": "지원하지 않는 action입니다.",
            }
        )

    async def _handle_accept(self, content):
        request_id = content.get("request_id")
        user = self.scope.get("user")

        if request_id is None:
            await self.send_json(
                {
                    "type": "accept_result",
                    "success": False,
                    "message": "request_id가 필요합니다.",
                }
            )
            return

        success = await self._try_accept(
            request_id=request_id,
            helper=user,
        )

        await self.send_json(
            {
                "type": "accept_result",
                "success": success,
                "request_id": request_id,
            }
        )

        if not success:
            return

        # 다른 도우미 화면에서 해당 요청 제거
        await self.channel_layer.group_send(
            services.HELPERS_GROUP,
            {
                "type": "request_taken",
                "request_id": request_id,
                "helper_id": user.id,
            },
        )

        # 이용자와 도우미가 접속하는 세션방에 매칭 결과 전달
        await self.channel_layer.group_send(
            services.session_group_name(request_id),
            {
                "type": "matched",
                "request_id": request_id,
                "helper_id": user.id,
                "helper_name": user.username,
            },
        )

    @database_sync_to_async
    def _try_accept(self, request_id, helper):
        return HelpRequest.try_accept(
            request_id=request_id,
            helper=helper,
        )

    # services.broadcast_new_request()의 group_send에 의해 호출
    async def new_request(self, event):
        await self.send_json(
            {
                "type": "new_request",
                "request_id": event["request_id"],
                "reservation_step": event.get("reservation_step", ""),
                "screenshot_url": event.get("screenshot_url"),
                "created_at": event.get("created_at"),
            }
        )

    # 다른 도우미가 먼저 수락했을 때 호출
    async def request_taken(self, event):
        await self.send_json(
            {
                "type": "request_taken",
                "request_id": event["request_id"],
                "helper_id": event.get("helper_id"),
            }
        )


class SessionConsumer(AsyncJsonWebsocketConsumer):
    """
    매칭된 이용자와 도우미가 사용하는 요청별 전용 채널.

    URL:
    /ws/session/<request_id>/

    캔버스:
    {
        "action": "draw",
        "shapes": [...]
    }

    도우미 완료:
    {
        "action": "complete"
    }

    이용자 혼자 진행:
    {
        "action": "im_fine"
    }
    """

    async def connect(self):
        self.request_id = self.scope["url_route"]["kwargs"]["request_id"]

        exists = await self._request_exists()

        if not exists:
            await self.close(code=4004)
            return

        self.group_name = services.session_group_name(
            self.request_id
        )

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send_json(
            {
                "type": "connected",
                "request_id": self.request_id,
                "message": "도움 세션에 연결되었습니다.",
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "draw":
            await self._handle_draw(content)

        elif action == "complete":
            await self._handle_complete()

        elif action == "im_fine":
            await self._handle_cancel()

        else:
            await self.send_json(
                {
                    "type": "error",
                    "message": "지원하지 않는 action입니다.",
                }
            )

    async def _handle_draw(self, content):
        shapes = content.get("shapes", [])

        if not isinstance(shapes, list):
            await self.send_json(
                {
                    "type": "error",
                    "message": "shapes는 배열이어야 합니다.",
                }
            )
            return

        await self._save_canvas(shapes)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "session_message",
                "payload": {
                    "action": "draw",
                    "shapes": shapes,
                },
            },
        )

    async def _handle_complete(self):
        success = await self._mark_done()

        if not success:
            await self.send_json(
                {
                    "type": "error",
                    "message": "완료할 수 없는 요청입니다.",
                }
            )
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "session_message",
                "payload": {
                    "action": "completed",
                },
            },
        )

    async def _handle_cancel(self):
        success = await self._cancel_request()

        if not success:
            await self.send_json(
                {
                    "type": "error",
                    "message": "종료할 수 없는 요청입니다.",
                }
            )
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "session_message",
                "payload": {
                    "action": "cancelled",
                },
            },
        )

    @database_sync_to_async
    def _request_exists(self):
        return HelpRequest.objects.filter(
            pk=self.request_id
        ).exists()

    @database_sync_to_async
    def _save_canvas(self, shapes):
        updated = HelpRequest.objects.filter(
            pk=self.request_id
        ).update(
            canvas_data=json.dumps(
                shapes,
                ensure_ascii=False,
            )
        )

        return updated == 1

    @database_sync_to_async
    def _mark_done(self):
        try:
            help_request = HelpRequest.objects.get(
                pk=self.request_id
            )
        except HelpRequest.DoesNotExist:
            return False

        previous_status = help_request.status
        help_request.mark_done()

        return (
            previous_status != help_request.status
            and help_request.status == HelpRequest.Status.DONE
        )

    @database_sync_to_async
    def _cancel_request(self):
        try:
            help_request = HelpRequest.objects.get(
                pk=self.request_id
            )
        except HelpRequest.DoesNotExist:
            return False

        previous_status = help_request.status
        help_request.cancel()

        return (
            previous_status != help_request.status
            and help_request.status
            == HelpRequest.Status.CANCELLED
        )

    async def matched(self, event):
        await self.send_json(
            {
                "type": "matched",
                "request_id": event["request_id"],
                "helper_id": event.get("helper_id"),
                "helper_name": event.get("helper_name"),
            }
        )

    async def session_message(self, event):
        await self.send_json(
            {
                "type": "session_message",
                "payload": event["payload"],
            }
        )