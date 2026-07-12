"""
통합 테스트용 스크립트 자리 (배포용 코드 아님).

원래 여기엔 "요청 생성 -> 도우미 동시 수락 -> 완료 -> 뱃지 지급" 전체 흐름을
검증하는 스크립트가 있었는데, 그 흐름 자체가 이제 팀이 직접 구현해야 할
부분이라 비워뒀습니다.

담당자 3(매칭)이 consumers.py 구현을 어느 정도 마치면, Channels의
WebsocketCommunicator를 이용해 아래 형태로 테스트를 짜볼 수 있습니다.

    from channels.testing import WebsocketCommunicator
    from apps.matching.routing import websocket_urlpatterns
    from channels.routing import URLRouter

    application = URLRouter(websocket_urlpatterns)
    comm = WebsocketCommunicator(application, "/ws/helpers/")
    connected, _ = await comm.connect()
    ...

참고 문서: https://channels.readthedocs.io/en/stable/topics/testing.html
"""

if __name__ == "__main__":
    print("아직 구현할 내용이 없습니다. 위 안내를 참고해서 직접 테스트를 작성해보세요.")
