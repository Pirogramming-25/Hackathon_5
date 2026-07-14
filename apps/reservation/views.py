"""
1. 이용자(User) 프론트 담당 뷰.

urls.py 가 아래 클래스/함수 이름을 이미 라우팅해뒀으니 이름은 유지하고
내용을 채우면 됩니다. 이용자는 로그인이 없으니 Django 세션(request.session)
으로만 식별한다는 것만 기억하면 됩니다.

SOS 버튼을 눌렀을 때 matching 앱의 HelpRequest 를 생성해서 도우미들에게
알리는 부분(sos_request)은 담당자 3(매칭)과 필드/이벤트 형식을 맞춰야 합니다.
공통 계약: apps/matching/models.py 의 HelpRequest 필드 참고.
"""
import base64
import json
import uuid

from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.matching.models import HelpRequest
from apps.matching.services import broadcast_new_request


class StartView(View):
    """예약 시작 화면. TODO: 템플릿 렌더링"""

    def get(self, request):
        return render(request, "reservation/step1_start.html")


class DateView(View):
    """날짜 선택. TODO: GET은 화면, POST는 선택값 저장 후 다음 단계로 이동"""

    def get(self, request):
        return render(request, "reservation/step2_date.html")

    def post(self, request):
        pass


class TimeView(View):
    def get(self, request):
        return render(request, "reservation/step3_time.html")

    def post(self, request):
        pass


class CareTypeView(View):
    def get(self, request):
        return render(request, "reservation/step4_care_type.html")

    def post(self, request):
        pass


class PaymentView(View):
    def get(self, request):
        return render(request, "reservation/step5_payment.html")

    def post(self, request):
        pass


class ConfirmView(View):
    def get(self, request):
        return render(request, "reservation/step6_confirm.html")


@csrf_exempt
@require_POST
def sos_request(request):
    """'찰칵! 도와주세요!' 버튼 클릭 시 호출."""
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "invalid_json"}, status=400)

    screenshot_data_url = payload.get("screenshot") or ""
    reservation_step = payload.get("reservation_step") or ""

    if not request.session.session_key:
        request.session.create()

    help_request = HelpRequest(
        user_session_key=request.session.session_key,
        reservation_step=reservation_step,
    )

    if screenshot_data_url.startswith("data:image"):
        try:
            header, encoded = screenshot_data_url.split(",", 1)
            ext = header.split("/")[1].split(";")[0]
            image_bytes = base64.b64decode(encoded)
        except (ValueError, IndexError, base64.binascii.Error):
            return JsonResponse({"error": "invalid_screenshot"}, status=400)

        help_request.screenshot.save(
            f"{uuid.uuid4().hex}.{ext}",
            ContentFile(image_bytes),
            save=False,
        )

    help_request.save()

    broadcast_new_request(help_request)

    return JsonResponse({"request_id": help_request.id})
