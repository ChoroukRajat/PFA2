from django.urls import path

from .views import *

urlpatterns = [
    path('metadata/complete/<str:guid>/', CompleteMetadataView.as_view(), name='complete_metadata'),
    path("fetch-hive-metadata/", FetchHiveMetadataAPIView.as_view(), name="fetch_hive_metadata"),
    path('llm/suggestions/terms', LLMSuggestionsFromColumns.as_view(), name='llm-suggestions'),
    path('llm/suggestions/classification',LLMClassificationAndRetention.as_view(), name='llm-classifications-suggestions'),
    path('recommendation/<int:rec_id>/status/', UpdateRecommendationStatusView.as_view(), name='update_rec_status'),
    # Database endpoints
    path('hive/databases/', HiveDatabaseListView.as_view(), name='hive-databases'),
    path('hive/databases/<uuid:db_guid>/', HiveDatabaseDetailView.as_view(), name='hive-database-detail'),
    path('hive/databases/<uuid:db_guid>/tables/', HiveTableListView.as_view(), name='hive-database-tables'),
    
    # Table endpoints
    path('hive/tables/<uuid:table_guid>/', HiveTableDetailView.as_view(), name='hive-table-detail'),
    path('hive/tables/<uuid:table_guid>/columns/', HiveColumnListView.as_view(), name='hive-table-columns'),
    
    # Column endpoints
    path('hive/columns/<uuid:column_guid>/', HiveColumnDetailView.as_view(), name='hive-column-detail'),
    
    # Recommendation endpoints
    path('metadata/recommendations/', MetadataRecommendationQualityListView.as_view(), name='metadata-recommendations'),
    path('metadata/recommendations/<uuid:guid>/', MetadataRecommendationListView.as_view(), name='metadata-recommendations-list'),
    path("sync-terms/", SyncTermsView.as_view(), name="sync_terms"),
    path("create-term/", CreateTermView.as_view(), name="create_term"),
    path("assign-term/", AssignTermToColumnView.as_view(), name="assign_term"),
    path('teams/terms/', TeamTermsView.as_view(), name='team-terms'),

]