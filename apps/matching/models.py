"""
공통 계약: HelpRequest 모델.

이 필드들은 4명이 전부 공유하는 데이터 구조라서 이름/타입을 바꾸지 않는 게
좋습니다 (바꾸면 다른 사람 코드가 깨짐). 그 외 실제 동작(동시 수락 처리,
완료/취소 처리 등)은 담당자 3이 이 모델에 메서드를 추가하며 직접 구현하세요.

HelpRequest 하나가 "이용자가 SOS 버튼을 눌러서 도우미가 매칭되고
완료(또는 종료)될 때까지"의 세션 전체를 나타냅니다.
"""
from django.conf import settings
from django.db import models


class HelpRequest(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING", "대기 중 (broadcast 중)"
        MATCHED = "MATCHED", "도우미 매칭됨"
        IN_PROGRESS = "IN_PROGRESS", "도움 진행 중"
        DONE = "DONE", "완료 (효자뱃지 지급 대상)"
        CANCELLED = "CANCELLED", "이용자가 '괜찮아요' 등으로 종료"

    # 이용자는 로그인이 없으므로 Django 세션 키만으로 식별한다.
    user_session_key = models.CharField(max_length=64, db_index=True)

    # 예약 화면의 어느 단계에서 도움을 요청했는지
    reservation_step = models.CharField(max_length=50, blank=True, default="")

    # 이용자 화면 캡처
    screenshot = models.ImageField(upload_to="screenshots/%Y/%m/%d/", null=True, blank=True)

    # 도우미가 캔버스에 그린 주석 데이터 (JSON 문자열 등, 형식은 담당자 2/3이 정하기)
    canvas_data = models.TextField(blank=True, default="")

    helper = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="accepted_requests",
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)

    created_at = models.DateTimeField(auto_now_add=True)
    matched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"HelpRequest#{self.id} [{self.status}]"

    # ------------------------------------------------------------------
    # TODO(담당자 3): 아래와 같은 동작들이 필요합니다. 메서드로 추가하든,
    # consumers.py 쪽에 직접 로직을 두든 원하는 방식으로 구현하세요.
    #
    # - 도우미가 "수락"을 눌렀을 때: 이미 WAITING 상태인 요청만 MATCHED로
    #   바꾸고 helper를 지정. 여러 도우미가 동시에 눌러도 한 명만 성공해야
    #   함 (select_for_update / 조건부 update 같은 방법으로 원자성 보장 필요)
    # - 완료 처리: status를 DONE으로, completed_at 기록
    # - 취소("괜찮아요!") 처리: status를 CANCELLED로, completed_at 기록
    # ------------------------------------------------------------------
