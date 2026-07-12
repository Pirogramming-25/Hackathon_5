"""
3. 매칭 로직 + 실시간 통신 담당 모델.

HelpRequest 하나가 "이용자가 SOS 버튼을 눌러서 도우미가 매칭되고
완료(또는 종료)될 때까지"의 세션 전체를 나타낸다.

동시 수락 문제(여러 도우미가 동시에 수락 버튼을 누르는 경우)는
try_accept() 안에서 select_for_update() + 조건부 update 로 원자적으로 처리한다.
"""
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone


class HelpRequest(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING", "대기 중 (broadcast 중)"
        MATCHED = "MATCHED", "도우미 매칭됨"
        IN_PROGRESS = "IN_PROGRESS", "도움 진행 중"
        DONE = "DONE", "완료 (효자뱃지 지급 대상)"
        CANCELLED = "CANCELLED", "이용자가 '괜찮아요' 등으로 종료"

    # 이용자는 로그인이 없으므로 Django 세션 키만으로 식별한다.
    user_session_key = models.CharField(max_length=64, db_index=True)

    # 예약 화면의 어느 단계에서 도움을 요청했는지 (reservation 담당자가 채워줌)
    reservation_step = models.CharField(max_length=50, blank=True, default="")

    # 이용자 화면 캡처. 실제 구현에서는 이미지 업로드/오브젝트 스토리지로 교체 가능.
    screenshot = models.ImageField(upload_to="screenshots/%Y/%m/%d/", null=True, blank=True)

    # 도우미가 캔버스에 그린 주석 데이터 (JSON 문자열: 화살표/원/텍스트 등의 좌표 목록)
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
    # 매칭 핵심 로직
    # ------------------------------------------------------------------
    @transaction.atomic
    def try_accept(self, helper_user) -> bool:
        """여러 도우미가 동시에 수락을 눌러도 단 한 명만 배정되도록 원자적으로 처리.

        Returns:
            True  -> 이 helper_user 가 배정에 성공함
            False -> 이미 다른 도우미가 먼저 가져감 (호출한 쪽은 '이미 매칭완료' 처리)
        """
        updated = (
            HelpRequest.objects.select_for_update()
            .filter(pk=self.pk, status=self.Status.WAITING)
            .update(status=self.Status.MATCHED, helper=helper_user, matched_at=timezone.now())
        )
        if updated:
            self.refresh_from_db()
            return True
        return False

    def mark_in_progress(self):
        self.status = self.Status.IN_PROGRESS
        self.save(update_fields=["status"])

    def mark_done(self):
        """예약 완료 또는 '괜찮아요!' 처리 -> 효자뱃지 지급 대상이 됨.

        실제 뱃지 지급은 accounts 앱의 Badge 모델/시그널에서 처리한다.
        (담당자 4와 연동 지점: apps/accounts/models.py 의 Badge, signals 참고)
        """
        self.status = self.Status.DONE
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at"])

    def cancel(self):
        self.status = self.Status.CANCELLED
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at"])
