from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

HELPERS_GROUP = "available_helpers"

def session_group_name(request_id):
    """도움 요청별 이용자, 도우미 전용 그룹 이름"""
    return f"help_session_{request_id}"

def broadcast_new_request(help_request):
    """
    새로운 HelpRequest가 만들어지면 대기 중인 모든 도우미에게 전달한다.

    reservation 담당자가 HelpRequest를 생성한 직후
    이 함수를 호출한다.
    """
    channel_layer = get_channel_layer()

    screenshot_url = None
    if help_request.screenshot:
        screenshot_url = help_request.screenshot.url

    async_to_sync(channel_layer.group_send)(
        HELPERS_GROUP,
        {
            "type": "new_request",
            "request_id": help_request.id,
            "reservation_step": help_request.reservation_step,
            "screenshot_url": screenshot_url,
            "created_at": help_request.created_at.isoformat(),
        },
    )

def broadcast_request_taken(request_id, helper_id):
    """
    한 명이 요청을 수락하면 다른 도우미들의 목록에서 
    해당 요청을 제거하도록 알린다.
    """
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        HELPERS_GROUP,
        {
            "type": "request_taken",
            "request_id": request_id,
            "helper_id": helper_id,
        },
    )