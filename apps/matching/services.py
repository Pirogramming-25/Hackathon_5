"""
매칭 관련 브로드캐스트 헬퍼 함수.

reservation 앱(이용자가 SOS를 누르는 뷰)과 accounts 앱(뱃지 지급)에서
이 모듈의 함수를 호출해서 서로 연결한다. 실제 프로토콜/페이로드는
자유롭게 바꿔도 되지만, 바꾸면 helper 앱의 canvas.js / waiting.js 도 같이 맞춰야 한다.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

HELPERS_GROUP = "helpers_online"


def _channel_layer():
    layer = get_channel_layer()
    if layer is None:
        raise RuntimeError(
            "CHANNEL_LAYERS 가 설정되지 않았습니다. config/settings.py 의 "
            "CHANNEL_LAYERS 설정을 확인하세요."
        )
    return layer


def broadcast_new_request(help_request):
    """이용자가 SOS 버튼을 누른 순간 호출. 온라인 상태인 모든 도우미에게 전파한다.

    TODO(담당자 3): 지금은 단순 broadcast(랜덤/선착순 수락) 방식.
    - 일정 시간(예: 15초) 내 수락이 없으면 이 함수를 다시 호출해 재알림하는
      타임아웃 로직을 Celery beat 이나 asyncio 태스크로 추가하면 좋다.
    - "최근에 너무 자주 배정된 도우미는 후순위로" 같은 공정 배분 로직도
      여기(또는 HelperPoolConsumer)에 추가하면 된다.
    """
    async_to_sync(_channel_layer().group_send)(
        HELPERS_GROUP,
        {
            "type": "new_request",
            "request_id": help_request.id,
            "reservation_step": help_request.reservation_step,
            "screenshot_url": help_request.screenshot.url if help_request.screenshot else None,
            "created_at": help_request.created_at.isoformat(),
        },
    )


def broadcast_request_taken(request_id, helper_id):
    """한 명이 수락한 직후, 나머지 도우미 화면에서 목록을 지우도록 알림."""
    async_to_sync(_channel_layer().group_send)(
        HELPERS_GROUP,
        {
            "type": "request_taken",
            "request_id": request_id,
            "helper_id": helper_id,
        },
    )


def session_group_name(request_id) -> str:
    return f"session_{request_id}"


def notify_user_matched(request_id, helper_name):
    """이용자 쪽 세션 그룹에 '도우미가 배정되었습니다' 알림."""
    async_to_sync(_channel_layer().group_send)(
        session_group_name(request_id),
        {"type": "matched", "helper_name": helper_name},
    )
