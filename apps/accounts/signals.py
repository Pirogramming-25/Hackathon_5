"""
4. 백엔드/인프라 담당.

HelpRequest 상태가 바뀔 때(post_save) 효자뱃지를 자동으로 지급하고 싶다면
여기에 시그널 핸들러를 구현하세요.

TODO(담당자 4):
- HelpRequest.status 가 완료/종료 계열로 바뀌고, helper 가 지정돼 있으면
  Badge.objects.get_or_create(helper=..., help_request=...) 로 뱃지 지급
- matching 앱을 여기서 import 하는 건 괜찮음 (accounts -> matching 단방향 참조라
  순환 임포트 문제 없음)
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.matching.models import HelpRequest


@receiver(post_save, sender=HelpRequest)
def award_badge_when_session_ends(sender, instance: HelpRequest, **kwargs):
    # TODO: 조건 확인 후 Badge 생성
    pass
