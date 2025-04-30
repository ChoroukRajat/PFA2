from django.urls import path

from .views import credentials, UploadCSVView, CSVMetadataView

urlpatterns = [
    path('credentials', credentials, name='credentials'),
    path('upload-csv', UploadCSVView.as_view(), name='upload-csv'),
    path('csvmetadata', CSVMetadataView.as_view()),

]