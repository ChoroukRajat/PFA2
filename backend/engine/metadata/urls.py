from django.urls import path

from .views import *

urlpatterns = [
    path('metadata/complete/<str:guid>/', CompleteMetadataView.as_view(), name='complete_metadata'),
    path("fetch-hive-metadata/", FetchHiveMetadataAPIView.as_view(), name="fetch_hive_metadata"),
    path('llm/suggestions/terms', LLMSuggestionsFromColumns.as_view(), name='llm-suggestions'),
    path('llm/suggestions/classification',LLMClassificationAndRetention.as_view(), name='llm-classifications-suggestions'),
    path('recommendation/<int:rec_id>/status/', UpdateRecommendationStatusView.as_view(), name='update_rec_status'),
]