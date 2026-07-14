from django.urls import path

from . import views

app_name = "helper"

urlpatterns = [
    path("", views.main_view, name="main"),
    path("waiting/", views.waiting_view, name="waiting"),
    path("login/", views.login_view, name="login"),
    path("signup/", views.signup_view, name="signup"),
    path("logout/", views.logout_view, name="logout"),
    path("session/<int:request_id>/", views.canvas_view, name="canvas"),
    path("mypage/", views.mypage_view, name="mypage"),
    path("myinfo/", views.myinfo_view, name="myinfo"),
    path("ranking/", views.ranking_view, name="ranking"),
    path("accept/", views.accept_view, name="accept"),
    path("complete/", views.complete_view, name="complete"),
    path("main/", views.main_view, name="main"),
]