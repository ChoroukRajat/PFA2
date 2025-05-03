from django.urls import path
from .views import (
    HiveDatabaseView,
    HiveTableView,
    HiveColumnView,
    GlossaryView,
    MetadataHierarchyView
)

urlpatterns = [
    path('hive/databases/', HiveDatabaseView.as_view(), name='hive-databases'),
    path('hive/databases/<str:db_name>/tables/', HiveTableView.as_view(), name='hive-tables'),
    path('hive/tables/<str:table_name>/columns/', HiveColumnView.as_view(), name='hive-columns'),
    path('glossary/', GlossaryView.as_view(), name='glossary'),
    path('metadata-hierarchy/', MetadataHierarchyView.as_view(), name='metadata-hierarchy'),
]