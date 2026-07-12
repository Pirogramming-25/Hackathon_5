"""
4. 백엔드/인프라 담당 API.

urls.py 가 아래 클래스 이름들을 이미 라우팅해뒀으니 클래스명은 유지하고
내용을 채우면 됩니다. Django 인증: https://docs.djangoproject.com/en/5.2/topics/auth/default/
DRF APIView: https://www.django-rest-framework.org/api-guide/views/
"""
from rest_framework.response import Response
from rest_framework.views import APIView


class SignupAPIView(APIView):
    """도우미 회원가입. POST {username, password, phone_number}

    TODO: SignupSerializer 로 검증 -> User.objects.create_user -> HelperProfile 생성
    -> login(request, user) -> 201 응답
    """

    def post(self, request):
        return Response(status=501)


class LoginAPIView(APIView):
    """도우미 로그인. POST {username, password}

    TODO: authenticate() -> 성공 시 login(request, user), 실패 시 400
    """

    def post(self, request):
        return Response(status=501)


class LogoutAPIView(APIView):
    """TODO: logout(request)"""

    def post(self, request):
        return Response(status=501)


class MyBadgesAPIView(APIView):
    """로그인한 도우미 본인의 효자뱃지 목록.

    TODO: Badge.objects.filter(helper=request.user) 직렬화해서 응답
    """

    def get(self, request):
        return Response(status=501)


class RankingAPIView(APIView):
    """이달의 효자 랭킹.

    TODO: 이번 달 Badge 를 helper 기준으로 집계(Count)해서 정렬 후 응답
    """

    def get(self, request):
        return Response(status=501)


class EnsureSessionAPIView(APIView):
    """이용자(비로그인) 쪽 익명 세션 발급.

    TODO: request.session.session_key 가 없으면 request.session.save() 로 생성
    후 session_key 응답
    """

    def get(self, request):
        return Response(status=501)
