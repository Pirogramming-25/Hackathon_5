"""
4. 백엔드/인프라 담당.

필드(입력/출력 형태)만 정의해뒀고, 실제 검증/생성 로직은 TODO입니다.
DRF 공식 문서: https://www.django-rest-framework.org/api-guide/serializers/
"""
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Badge, HelperProfile


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=4)
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")

    # TODO: validate_username (아이디 중복 체크 등)
    # TODO: create (User.objects.create_user + HelperProfile.objects.create)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "help_request", "awarded_at"]


class RankingEntrySerializer(serializers.Serializer):
    helper_id = serializers.IntegerField()
    username = serializers.CharField()
    badge_count = serializers.IntegerField()
