// TODO(담당자 1): SOS 버튼 클릭 -> 화면 캡처 -> /sos/request/ 로 전송 ->
// 응답받은 request_id 로 ws://.../ws/session/<id>/ 접속해서 실시간으로
// 매칭 결과/도우미 안내를 받는 로직을 구현하세요.
//
// 참고할 서버 쪽 코드: apps/reservation/views.py 의 sos_request,
// apps/matching/consumers.py 의 SessionConsumer (담당자 3과 이벤트 형식 맞추기)
