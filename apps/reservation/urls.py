from django.urls import path

from . import views

app_name = "reservation"

urlpatterns = [
    path("", views.StartView.as_view(), name="start"),
    path("date/", views.DateView.as_view(), name="date"),
    path("time/", views.TimeView.as_view(), name="time"),
    path("care-type/", views.CareTypeView.as_view(), name="care_type"),
    path("payment/", views.PaymentView.as_view(), name="payment"),
    path("confirm/", views.ConfirmView.as_view(), name="confirm"),
    path("sos/request/", views.sos_request, name="sos_request"),
]
