"""
- HelperProfile : 도우미 전용 부가정보(휴대폰 본인인증 등). 이용자는 계정 자체가 없으므로
    별도 프로필/테이블이 필요 없다 (Django 세션의 session_key 만 사용)
- Badge         : 효자뱃지. 도움 요청(HelpRequest) 하나가 끝날 때마다 1개 지급
    실제 지급 로직은 signals.py 에서 HelpRequest 저장 시그널을 받아 처리
"""
from django.conf import settings
from django.db import models


class HelperProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="helper_profile"
    )
    phone_number = models.CharField(max_length=20, blank=True, default="")
    # TODO: 실제 SMS/PASS 본인인증 연동 후 True 로 전환
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    intro = models.CharField(max_length=200, blank=True, default="")
    profile_image = models.ImageField(upload_to="profiles/%Y/%m/%d/", null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}의 프로필"


class Badge(models.Model):
    helper = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="badges"
    )
    help_request = models.OneToOneField(
        "matching.HelpRequest", 
        on_delete=models.CASCADE, 
        related_name="badge"
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-awarded_at"]

    def __str__(self):
        return f"{self.helper.username} 효자뱃지 (요청 #{self.help_request_id})"
