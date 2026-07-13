"""
1. 이용자(User) 프론트 담당 뷰.

urls.py 가 아래 클래스/함수 이름을 이미 라우팅해뒀으니 이름은 유지하고
내용을 채우면 됩니다. 이용자는 로그인이 없으니 Django 세션(request.session)
으로만 식별한다는 것만 기억하면 됩니다.

SOS 버튼을 눌렀을 때 matching 앱의 HelpRequest 를 생성해서 도우미들에게
알리는 부분(sos_request)은 담당자 3(매칭)과 필드/이벤트 형식을 맞춰야 합니다.
공통 계약: apps/matching/models.py 의 HelpRequest 필드 참고.
"""
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


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
    """'찰칵! 도와주세요!' 버튼 클릭 시 호출.

    TODO:
    - 이용자 세션 키 확보 (없으면 발급)
    - matching.HelpRequest 생성 (screenshot, reservation_step 등)
    - 도우미들에게 알림(웹소켓 broadcast) — 담당자 3의 구현과 연결
    - {"request_id": ...} JSON 응답
    """
    return JsonResponse({}, status=501)
