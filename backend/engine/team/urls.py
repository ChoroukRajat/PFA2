from django.urls import path
from .views import (
    TeamDashboardView,
    TeamAnnotationsByTypeView,
    TeamFileUploadsOverTimeView,
    TeamActivityTimelineView
)

urlpatterns = [
    path('team/dashboard/', TeamDashboardView.as_view(), name='team-dashboard'),
    path('team/annotations/by-type/', TeamAnnotationsByTypeView.as_view(), name='team-annotations-by-type'),
    path('team/files/uploads-over-time/', TeamFileUploadsOverTimeView.as_view(), name='team-file-uploads-over-time'),
    path('team/activity/timeline/', TeamActivityTimelineView.as_view(), name='team-activity-timeline'),
]
