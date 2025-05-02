from django.urls import path
from .views import (
    AtlasSearchView,
    GlossaryView,
    AnnotationView,
    ApproveAnnotationView,
    RejectAnnotationView,
    UserAnnotationsView
)

urlpatterns = [
    path('atlas/search/<str:entity_type>/', AtlasSearchView.as_view(), name='atlas-search'),
    path('glossary/', GlossaryView.as_view(), name='glossary'),
    path('annotations/', AnnotationView.as_view(), name='annotations'),
    path('annotations/<int:annotation_id>/approve/', ApproveAnnotationView.as_view(), name='approve-annotation'),
    path('annotations/<int:annotation_id>/reject/', RejectAnnotationView.as_view(), name='reject-annotation'),
    path('user/annotations/', UserAnnotationsView.as_view(), name='user-annotations'),
]