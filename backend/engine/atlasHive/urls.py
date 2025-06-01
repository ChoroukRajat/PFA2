from django.urls import path
from .views import *

urlpatterns = [
    path('hive/databases1/', HiveDatabaseView.as_view(), name='hive-databases'),
    path('hive/databases1/<str:db_name>/tables/', HiveTableView.as_view(), name='hive-tables'),
    path('hive/tables1/<str:table_name>/columns/', HiveColumnView.as_view(), name='hive-columns'),
    path('glossary/', GlossaryView.as_view(), name='glossary'),
    path('metadata-hierarchy/', MetadataHierarchyView.as_view(), name='metadata-hierarchy'),

    path('personal-glossaries/', PersonalGlossaryListCreateView.as_view(), name='personal-glossaries-list'),
    path('personal-glossaries/<int:pk>/', PersonalGlossaryRetrieveUpdateDestroyView.as_view(), name='personal-glossaries-detail'),
    
    # Personal Glossary Terms
    path('personal-glossaries/<int:glossary_id>/terms/', PersonalGlossaryTermListCreateView.as_view(), name='personal-glossary-terms-list'),
    path('personal-glossary-terms/<int:pk>/', PersonalGlossaryTermRetrieveUpdateDestroyView.as_view(), name='personal-glossary-terms-detail'),
    path('personal-glossary-terms/', PersonalGlossaryTermCreateView.as_view(), name='personal-glossary-terms-create'),
    
    # Personal Annotations
    path('personal-annotations/', PersonalAnnotationListCreateView.as_view(), name='personal-annotations-list'),
    path('personal-annotations/<int:pk>/', PersonalAnnotationRetrieveUpdateDestroyView.as_view(), name='personal-annotations-detail'),

    # Standard Annotations
    path('annotations/', AnnotationListCreateView.as_view(), name='annotations-list'),
    path('annotations/<int:pk>/', AnnotationRetrieveUpdateDestroyView.as_view(), name='annotations-detail'),
    path('steward/annotations/', UserAnnotationsView.as_view(), name='user-annotations'),
    path(
        'annotations/<str:annotation_type>/<int:annotation_id>/<str:action>/',
        AnnotationStatusUpdateView.as_view(),
        name='annotation-status-update'
    ),

    
]