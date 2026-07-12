"""
2. 도우미(Helper) 프론트 담당 뷰.

실제 로그인/회원가입 처리(계정 생성, 인증)는 accounts 앱의 API가 담당하고,
여기 뷰들은 화면(템플릿) 렌더링과 로그인 여부에 따른 접근 제어만 담당한다.
"""
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from apps.matching.models import HelpRequest


def login_view(request):
    if request.user.is_authenticated:
        return redirect("helper:waiting")
    return render(request, "helper/login.html")


def signup_view(request):
    if request.user.is_authenticated:
        return redirect("helper:waiting")
    return render(request, "helper/signup.html")


def logout_view(request):
    logout(request)
    return redirect("helper:login")


@login_required
def waiting_view(request):
    """대기 상태 화면. 새 요청은 ws/helpers/ 로 실시간으로 받는다 (waiting.js)."""
    return render(request, "helper/waiting.html")


@login_required
def canvas_view(request, request_id):
    """매칭된 세션의 캔버스 화면. 이용자가 보낸 스크린샷 위에 그려서 안내한다."""
    help_request = HelpRequest.objects.filter(pk=request_id).first()
    screenshot_url = help_request.screenshot.url if help_request and help_request.screenshot else ""
    return render(
        request,
        "helper/canvas.html",
        {"request_id": request_id, "screenshot_url": screenshot_url},
    )


@login_required
def mypage_view(request):
    """효자뱃지 개수 / 이달의 효자 랭킹. 데이터는 accounts API를 fetch로 호출해서 채운다."""
    return render(request, "helper/mypage.html")
