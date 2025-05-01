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


]