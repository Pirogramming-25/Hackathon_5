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
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class HelperPoolConsumer(AsyncJsonWebsocketConsumer):
    """도우미가 접속해서 대기하는 채널.

    TODO(담당자 3):
    - connect(): 이 채널을 "도우미 대기 그룹"에 추가
    - disconnect(): 그룹에서 제거
    - receive_json(): {"action": "accept", "request_id": N} 같은 메시지를 받아서
      HelpRequest를 원자적으로 배정 시도 -> 성공/실패를 클라이언트에 응답
    - 새 요청이 들어왔을 때 그룹 전체에 broadcast 하는 부분(= group_send로
      호출되는 이벤트 핸들러 메서드)도 필요
    """

    async def connect(self):
        # TODO: group_add 등
        await self.accept()

    async def disconnect(self, close_code):
        # TODO: group_discard 등
        pass

    async def receive_json(self, content, **kwargs):
        # TODO: action에 따라 분기 처리
        pass


class SessionConsumer(AsyncJsonWebsocketConsumer):
    """매칭이 성사된 이후 이용자<->도우미가 화면/채팅을 주고받는 채널.

    TODO(담당자 3):
    - connect(): url_route 로 넘어온 request_id 기준 세션 그룹에 join
    - receive_json(): 캔버스 그리기, 채팅, 완료/취소 같은 이벤트를 세션
      그룹 전체(이용자+도우미)에 릴레이
    - 완료/취소 시 HelpRequest 상태 갱신까지 여기서 처리할지 결정
    """

    async def connect(self):
        # TODO
        await self.accept()

    async def disconnect(self, close_code):
        # TODO
        pass

    async def receive_json(self, content, **kwargs):
        # TODO
        pass
