from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("signup/", views.SignupAPIView.as_view(), name="signup"),
    path("login/", views.LoginAPIView.as_view(), name="login"),
    path("logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("badges/me/", views.MyBadgesAPIView.as_view(), name="my-badges"),
    path("ranking/", views.RankingAPIView.as_view(), name="ranking"),
    path("session/", views.EnsureSessionAPIView.as_view(), name="session"),
]
