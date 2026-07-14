"""
2. 도우미(Helper) 프론트 담당 뷰.

urls.py 가 아래 함수 이름들을 이미 라우팅해뒀으니 이름은 유지하고 내용을
채우면 됩니다. 로그인/회원가입 "실제 처리"는 accounts 앱의 API를 fetch()로
호출하는 방식(담당자 4와 계약)으로 구현하는 걸 추천합니다.
"""
from django.shortcuts import render


def login_view(request):
    """TODO: 로그인 폼 화면. 로그인된 상태면 waiting으로 리다이렉트"""
    return render(request, "helper/login.html")


def signup_view(request):
    """TODO: 회원가입 폼 화면"""
    return render(request, "helper/signup.html")


def logout_view(request):
    """TODO: 로그아웃 처리 후 login으로 리다이렉트"""
    pass


def waiting_view(request):
    """TODO: 로그인 필요. 대기 화면 (새 요청은 ws/helpers/ 로 실시간 수신)"""
    return render(request, "helper/home.html")


def canvas_view(request, request_id):
    """TODO: 로그인 필요. request_id 에 해당하는 HelpRequest의 스크린샷을
    가져와서 캔버스 화면에 표시"""
    return render(request, "helper/drawings.html", {"request_id": request_id})


def mypage_view(request):
    """TODO: 로그인 필요. accounts API(badges/me, ranking)를 fetch로 불러와 표시"""
    return render(request, "helper/mypage.html")


def myinfo_view(request):
    """TODO: 로그인 필요. 프로필 수정 화면"""
    return render(request, "helper/myinfo.html")


def ranking_view(request):
    """TODO: accounts API(ranking)를 fetch로 불러와 표시"""
    return render(request, "helper/ranking.html")

def accept_view(request):
    """TODO: 도움 요청 발생 모달 화면"""
    return render(request, "helper/accept.html")


def complete_view(request):
    """TODO: 효자 배지 획득 완료 모달 화면"""
    return render(request, "helper/complete.html")