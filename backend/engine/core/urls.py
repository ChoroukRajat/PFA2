from django.urls import path

from .views import *


urlpatterns = [
    path('credentials', credentials, name='credentials'),
    path('upload-csv', UploadCSVView.as_view(), name='upload-csv'),
    path('csvmetadata', CSVMetadataView.as_view()),
    path('remove/missingvalues', RemoveMissingValues.as_view()),
    path('remove/duplicates', RemoveDuplicates.as_view()),
    path('download/original', DownloadOriginalFile.as_view()),
    path('download/duplicates', DownloadDuplicatesFile.as_view()),
    path('download/missingvalues', DownloadMissingValuesFile.as_view()),
    path('analyze/<str:filename>', AnalyzeFileView.as_view(), name='analyze-file'),
    path('normalize/<str:column_name>', NormalizeColumnView.as_view(), name='normalize-column'),
    path('download/normalized', DownloadNormalizedFile.as_view(), name='download-normalized'),
    path(
        'teamfileactions/<int:team_id>/',
        TeamFileActionsView.as_view()
    ),
    path(
        'teamactivitystats/<int:team_id>/',
        TeamActivityStatsView.as_view()
    ),
    

    # Main dashboard endpoint
    path('dashboard/', UserDashboardView.as_view(), name='user-dashboard'),
    
    # File actions endpoints
    path('dashboard/file-actions/', UserFileActionsView.as_view(), name='user-file-actions'),
    
    # Annotations endpoints
    path('dashboard/annotations/', UserAnnotationsView.as_view(), name='user-annotations'),
    
    # Personal annotations endpoints
    path('dashboard/personal-annotations/', UserPersonalAnnotationsView.as_view(), name='user-personal-annotations'),
    
    # Activity timeline
    path('dashboard/activity/', UserActivityTimelineView.as_view(), name='user-activity-timeline'),

    path('hive-upload/', HiveUploadView.as_view(), name='hive-upload'),


]