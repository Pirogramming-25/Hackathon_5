from django.urls import path

from . import views

app_name = "helper"

urlpatterns = [
    path("", views.waiting_view, name="waiting"),
    path("login/", views.login_view, name="login"),
    path("signup/", views.signup_view, name="signup"),
    path("logout/", views.logout_view, name="logout"),
    path("session/<int:request_id>/", views.canvas_view, name="canvas"),
    path("mypage/", views.mypage_view, name="mypage"),
]
