"""
4. 백엔드/인프라 담당 API.

도우미 회원가입/로그인/로그아웃(세션 기반), 효자뱃지·랭킹 조회, 그리고
이용자(비로그인)를 위한 세션 발급 API를 제공한다.

담당자 2(도우미 프론트)의 login.html / signup.html / mypage.html 이 여기 API를
fetch() 로 호출해서 쓰는 구조다.
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Badge
from .serializers import (
    BadgeSerializer,
    LoginSerializer,
    RankingEntrySerializer,
    SignupSerializer,
)

# NOTE: signup/login/logout 은 helper 프론트에서 fetch()로 호출하는 순수 JSON API라
# 서버 렌더링 폼의 {% csrf_token %} 이 없다. 스캐폴드 단계에서는 csrf_exempt로 열어두고,
# 실제 배포 전에는 CSRF 쿠키(ensure_csrf_cookie) + X-CSRFToken 헤더 방식으로 교체할 것.
# TODO(담당자 4): 프로덕션 전 CSRF 처리 정식 적용


@method_decorator(csrf_exempt, name="dispatch")
class SignupAPIView(APIView):
    """도우미 회원가입. POST {username, password, phone_number}"""

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response({"username": user.username}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class LoginAPIView(APIView):
    """도우미 로그인. POST {username, password}"""

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "아이디 또는 비밀번호가 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response({"username": user.username})


@method_decorator(csrf_exempt, name="dispatch")
class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyBadgesAPIView(APIView):
    """로그인한 도우미 본인이 지금까지 받은 효자뱃지 목록."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        badges = Badge.objects.filter(helper=request.user)
        return Response(BadgeSerializer(badges, many=True).data)


class RankingAPIView(APIView):
    """이달의 효자 랭킹: 이번 달 획득한 뱃지 개수로 정렬한 상위 20명."""

    def get(self, request):
        now = timezone.now()
        qs = (
            User.objects.filter(
                badges__awarded_at__year=now.year, badges__awarded_at__month=now.month
            )
            .annotate(badge_count=Count("badges"))
            .order_by("-badge_count")[:20]
        )
        data = [
            {"helper_id": u.id, "username": u.username, "badge_count": u.badge_count}
            for u in qs
        ]
        return Response(RankingEntrySerializer(data, many=True).data)


@method_decorator(csrf_exempt, name="dispatch")
class EnsureSessionAPIView(APIView):
    """이용자(비로그인) 쪽에서 페이지 로드 시 호출: 익명 세션 키를 발급/반환.

    이용자는 계정 테이블이 없으므로, matching 앱의 HelpRequest.user_session_key 는
    여기서 내려주는 session_key 를 그대로 저장한다.
    """

    def get(self, request):
        if not request.session.session_key:
            request.session.save()
        return Response({"session_key": request.session.session_key})
