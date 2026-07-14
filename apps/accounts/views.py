"""
urls.py 가 아래 클래스 이름들을 이미 라우팅해뒀으니 클래스명은 유지하고
내용을 채우면 됩니다. Django 인증: https://docs.djangoproject.com/en/5.2/topics/auth/default/
DRF APIView: https://www.django-rest-framework.org/api-guide/views/
"""
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import SignupSerializer, LoginSerializer, BadgeSerializer, RankingEntrySerializer
from django.contrib.auth import login, authenticate, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Max
from django.utils import timezone
from .models import Badge

@method_decorator(csrf_exempt, name="dispatch")
class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        
        return Response({"username": user.username}, status=201)

@method_decorator(csrf_exempt, name="dispatch")
class LoginAPIView(APIView):
    #도우미 로그인. POST {username, password}
    #authenticate() -> 성공 시 login(request, user), 실패 시 400

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response({"detail": "아이디 또는 비밀번호가 올바르지 않습니다."}, status=400)
        login(request, user)
        return Response({"username": user.username})

class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=204)


class MyBadgesAPIView(APIView):
    #로그인한 도우미 본인의 효자뱃지 목록.
    #Badge.objects.filter(helper=request.user) 직렬화해서 응답
    def get(self, request):
        if not request.user.is_authenticated:
            return Response(status=401)
        
        badges = Badge.objects.filter(helper=request.user)
        serializer = BadgeSerializer(badges, many=True)
        return Response(serializer.data)


class RankingAPIView(APIView):
    #이달의 효자 랭킹.
    #이번 달 Badge 를 helper 기준으로 집계(Count)해서 정렬 후 응답
    def get(self, request):
        now = timezone.now()
        
        #이번 달에 지급된 뱃지만 필터링
        badges_this_month = Badge.objects.filter(
            awarded_at__year=now.year,
            awarded_at__month=now.month,
        )
        
        #helper별로 묶어서 개수 세고 많은 순으로 정렬
        #badge_count 내림차순, 동점이면 그 개수를 먼저 채운 사람이 위
        #뱃지를 1개 이상 받은 도우미만 집계 대상(0개인 도우미는 랭킹에 노출하지 않음)
        ranking = (
            badges_this_month.values("helper_id", "helper__username")
            .annotate(badge_count=Count("id"), last_awarded=Max("awarded_at"))
            .order_by("-badge_count", "last_awarded")
        )
        
        # RankingEntrySerializer가 원하는 필드명(username)으로 맞춰서 변환
        data = [
            {
                "helper_id": row["helper_id"],
                "username": row["helper__username"],
                "badge_count": row["badge_count"],
            }
            for row in ranking
        ]
        serializer = RankingEntrySerializer(data, many=True)
        return Response(serializer.data)


class EnsureSessionAPIView(APIView):
    #이용자(로그인 X) 쪽 익명 세션 발급
    #request.session.session_key 가 없으면 request.session.save() 로 생성 후 session_key 응답

    def get(self, request):
        # 세션이 아직 한 번도 저장된 적 없으면(session_key가 None) 새로 생성
        if not request.session.session_key:
            request.session.save()
        #생성됐거나 이미 있던 session_key를 응답으로 돌려줌
        return Response({"session_key": request.session.session_key})
