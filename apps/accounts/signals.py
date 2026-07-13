#HelpRequest 상태가 바뀔 때(post_save) 효자뱃지를 자동으로 지급하는 로직

# - HelpRequest.status 가 완료/종료 계열로 바뀌고 helper가 지정돼 있으면
# Badge.objects.get_or_create(helper=..., help_request=...) 로 뱃지 지급

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.matching.models import HelpRequest

from .models import Badge

#HelpRequest 객체가 저장될 때마다 아래 함수 실행해줘
@receiver(post_save, sender=HelpRequest)
def award_badge_when_session_ends(sender, instance: HelpRequest, **kwargs):
  # 완료 상태이고 도우미가 배정되어 있는 경우에만 뱃지 지급대상을 봄
  if instance.status == HelpRequest.Status.DONE and instance.helper_id:
    # 이미 뱃지가 있으면 그대로 두고 없으면 생성
    Badge.objects.get_or_create(helper=instance.helper, help_request=instance)