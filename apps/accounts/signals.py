"""
HelpRequest 가 저장될 때 상태를 확인해서 효자뱃지를 자동 지급한다.

지급 조건: 도우미가 배정된(helper_id 존재) 상태에서 세션이 끝났을 때
(예약 완료 = DONE, 또는 이용자가 도움 도중 "괜찮아요!" = CANCELLED 도
  실제로는 도우미가 이미 도움을 준 뒤이므로 뱃지 지급 대상).

matching 앱을 accounts 앱이 참조하는 방향(단방향)이라 순환 임포트가 없다.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.matching.models import HelpRequest

from .models import Badge


@receiver(post_save, sender=HelpRequest)
def award_badge_when_session_ends(sender, instance: HelpRequest, **kwargs):
    ended_statuses = {HelpRequest.Status.DONE, HelpRequest.Status.CANCELLED}
    if instance.status in ended_statuses and instance.helper_id:
        Badge.objects.get_or_create(helper_id=instance.helper_id, help_request=instance)
