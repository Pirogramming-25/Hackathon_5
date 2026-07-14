"""
4. 백엔드/인프라 담당.
DRF 공식 문서: https://www.django-rest-framework.org/api-guide/serializers/
"""
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Badge, HelperProfile


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=4)
    
    #validate_username (아이디 중복 체크)
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 사용 중인 아이디입니다.")
        return value

    #create (User.objects.create_user + HelperProfile.objects.create)
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            first_name=validated_data["name"],
        )
        HelperProfile.objects.create(user=user)
        return user

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



