"""
1. 이용자(User) 프론트 담당 뷰.

예약 6단계(시작 -> 날짜 -> 시간 -> 진료유형 -> 결제 -> 확인)는 지금은
세션에 선택값을 저장하는 아주 단순한 형태다. 실제 병원/기관 연동이 아니라
"디지털 취약계층이 예약을 진행하는 화면"을 재현하는 목업이므로,
담당자 1은 여기 화면 구성/문구/단계만 자유롭게 바꾸면 된다.

SOS 관련 로직(sos_request)은 화면 캡처를 받아서 matching 앱에 넘겨주는
연결부이니, 프로토콜(필드명)을 바꿀 경우 matching 담당자와 맞춰야 한다.
"""
from django.shortcuts import redirect, render
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse

from apps.matching.models import HelpRequest
from apps.matching.services import broadcast_new_request

from .utils import ensure_session

RESERVATION_SESSION_KEY = "reservation_draft"


def _draft(request):
    return request.session.setdefault(RESERVATION_SESSION_KEY, {})


class StartView(View):
    template_name = "reservation/step1_start.html"

    def get(self, request):
        ensure_session(request)
        return render(request, self.template_name, {"step": "start"})


class DateView(View):
    template_name = "reservation/step2_date.html"

    def get(self, request):
        ensure_session(request)
        return render(request, self.template_name, {"step": "date", "draft": _draft(request)})

    def post(self, request):
        draft = _draft(request)
        draft["date"] = request.POST.get("date")
        request.session.modified = True
        return redirect("reservation:time")


class TimeView(View):
    template_name = "reservation/step3_time.html"
    slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]

    def get(self, request):
        ensure_session(request)
        return render(
            request,
            self.template_name,
            {"step": "time", "draft": _draft(request), "slots": self.slots},
        )

    def post(self, request):
        draft = _draft(request)
        draft["time"] = request.POST.get("time")
        request.session.modified = True
        return redirect("reservation:care_type")


class CareTypeView(View):
    template_name = "reservation/step4_care_type.html"
    care_types = [
        ("general", "일반 진료", "기본 상담 및 진료"),
        ("checkup", "건강검진", "종합 건강검진 프로그램"),
        ("vaccine", "예방접종", "독감, 대상포진 등 예방접종"),
        ("etc", "기타 상담", "기타 문의 및 상담"),
    ]

    def get(self, request):
        ensure_session(request)
        return render(
            request,
            self.template_name,
            {"step": "care_type", "draft": _draft(request), "care_types": self.care_types},
        )

    def post(self, request):
        draft = _draft(request)
        draft["care_type"] = request.POST.get("care_type")
        request.session.modified = True
        return redirect("reservation:payment")


class PaymentView(View):
    template_name = "reservation/step5_payment.html"
    deposit = 10000

    def get(self, request):
        ensure_session(request)
        return render(
            request,
            self.template_name,
            {"step": "payment", "draft": _draft(request), "deposit": self.deposit},
        )

    def post(self, request):
        draft = _draft(request)
        # TODO(담당자 1): 실제 결제(PG) 연동 없이, 결제수단 선택값만 저장하는 목업
        draft["payment_method"] = request.POST.get("payment_method", "card")
        draft["paid"] = True
        request.session.modified = True
        return redirect("reservation:confirm")


class ConfirmView(View):
    template_name = "reservation/step6_confirm.html"

    def get(self, request):
        ensure_session(request)
        return render(request, self.template_name, {"step": "confirm", "draft": _draft(request)})


@csrf_exempt  # TODO(담당자 1/4): 배포 전 CSRF 쿠키 방식으로 교체
@require_POST
def sos_request(request):
    """이용자가 '찰칵! 도와주세요!' 버튼을 눌렀을 때 호출되는 엔드포인트.

    multipart/form-data:
      - screenshot: 캡처된 이미지 파일 (html2canvas 결과를 blob 으로 전송)
      - step: 현재 예약 단계 이름 (예: 'date', 'time', ...)

    응답: {"request_id": <HelpRequest.id>}
    이후 프론트(sos.js)는 이 request_id 로 /ws/session/<id>/ 웹소켓에 접속해
    매칭 결과와 도우미의 안내를 실시간으로 받는다.
    """
    session_key = ensure_session(request)
    help_request = HelpRequest.objects.create(
        user_session_key=session_key,
        reservation_step=request.POST.get("step", ""),
        screenshot=request.FILES.get("screenshot"),
    )
    broadcast_new_request(help_request)
    return JsonResponse({"request_id": help_request.id})
