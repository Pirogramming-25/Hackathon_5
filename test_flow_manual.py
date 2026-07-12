"""
수동 통합 테스트 스크립트 (배포용 코드 아님).

matching/accounts 담당자가 "요청 생성 -> broadcast -> 수락(동시성 방지) ->
완료 -> 효자뱃지 자동 지급" 전체 파이프라인이 실제로 동작하는지 빠르게
확인하기 위한 스크립트. `python manage.py shell` 대신 asyncio + Channels
WebsocketCommunicator 로 실제 consumer 를 직접 통과시켜 검증한다.

실행: DJANGO_SETTINGS_MODULE 이 설정된 채로 `python test_flow_manual.py`
"""
import asyncio
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from asgiref.sync import sync_to_async  # noqa: E402
from channels.routing import URLRouter  # noqa: E402
from channels.testing import WebsocketCommunicator  # noqa: E402
from django.contrib.auth.models import User  # noqa: E402

from apps.accounts.models import Badge  # noqa: E402
from apps.matching.models import HelpRequest  # noqa: E402
from apps.matching.routing import websocket_urlpatterns  # noqa: E402


async def main():
    application = URLRouter(websocket_urlpatterns)

    helper_a = await sync_to_async(User.objects.create_user)(username="helper_a", password="pass1234")
    helper_b = await sync_to_async(User.objects.create_user)(username="helper_b", password="pass1234")

    help_request = await sync_to_async(HelpRequest.objects.create)(
        user_session_key="test-session-key", reservation_step="date"
    )
    print(f"[1] HelpRequest 생성 완료: id={help_request.id}, status={help_request.status}")

    comm_a = WebsocketCommunicator(application, "/ws/helpers/")
    comm_a.scope["user"] = helper_a
    comm_b = WebsocketCommunicator(application, "/ws/helpers/")
    comm_b.scope["user"] = helper_b

    assert (await comm_a.connect())[0]
    assert (await comm_b.connect())[0]
    print("[2] 도우미 A, B 모두 helpers pool 접속 완료")

    # 두 도우미가 동시에 같은 요청을 수락 시도 -> 한 명만 성공해야 함
    await comm_a.send_json_to({"action": "accept", "request_id": help_request.id})
    await comm_b.send_json_to({"action": "accept", "request_id": help_request.id})

    result_a = await comm_a.receive_json_from()
    result_b = await comm_b.receive_json_from()
    print(f"[3] A 결과: {result_a}")
    print(f"[3] B 결과: {result_b}")

    successes = [r for r in (result_a, result_b) if r["success"]]
    assert len(successes) == 1, "동시 수락 시 정확히 한 명만 성공해야 함"
    print("[3] 동시 수락 원자성 검증 통과: 정확히 1명만 배정됨")

    # 진 쪽(B)은 request_taken 알림도 받아야 함
    taken_msg = await comm_b.receive_json_from()
    print(f"[4] 배정 실패한 쪽이 받은 알림: {taken_msg}")
    assert taken_msg["type"] == "request_taken"

    winner_comm = comm_a if result_a["success"] else comm_b

    # 세션(캔버스/채팅) 채널 접속 후 완료 처리
    session_comm = WebsocketCommunicator(application, f"/ws/session/{help_request.id}/")
    assert (await session_comm.connect())[0]
    print("[5] 세션 채널 접속 완료")

    await session_comm.send_json_to({"action": "complete"})
    completed_msg = await session_comm.receive_json_from()
    print(f"[6] 완료 처리 브로드캐스트: {completed_msg}")

    hr = await sync_to_async(HelpRequest.objects.get)(pk=help_request.id)
    print(f"[7] 최종 상태: {hr.status}")
    assert hr.status == HelpRequest.Status.DONE

    badge_exists = await sync_to_async(
        Badge.objects.filter(help_request=hr).exists
    )()
    print(f"[8] 효자뱃지 자동 지급 여부: {badge_exists}")
    assert badge_exists

    await comm_a.disconnect()
    await comm_b.disconnect()
    await session_comm.disconnect()

    print("\n✅ 전체 파이프라인(요청 생성 -> 동시 수락 처리 -> 완료 -> 뱃지 지급) 정상 동작 확인")


asyncio.run(main())
