def ensure_session(request):
    """이용자는 로그인이 없으므로, 세션 키가 아직 없으면 만들어서 반환한다.

    이 session_key 가 matching.HelpRequest.user_session_key 로 저장되어
    "이 요청은 어느 이용자가 보냈는가"를 식별하는 유일한 값이 된다.
    """
    if not request.session.session_key:
        request.session.save()
    return request.session.session_key
