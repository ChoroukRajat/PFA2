from django.urls import path
from .views import *

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login', LoginView.as_view()),
    path('user', UserView.as_view()),
    path('oauth/github/', GitHubOAuthView.as_view()),
    path('admin/new', BulkCreateUsersView.as_view()),
    path('teams/<int:team_id>/users/', TeamUsersView.as_view()),
    path('toggleactivate/', ToggleTeamUsersActiveStatusView.as_view()),
    
    path('datadomains/create/', CreateDataDomainView.as_view()),
    path('datadomains/update/<int:pk>/', UpdateDataDomainView.as_view()),
    path('datadomains/delete/<int:pk>/', DeleteDataDomainView.as_view()),

    path('users/<int:user_id>/add-datadomain/', AddDataDomainToUser.as_view()),
    path('users/<int:user_id>/remove-datadomain/', RemoveDataDomainFromUser.as_view()),
    path('users/<int:user_id>/update-datadomains/', ReplaceUserDataDomains.as_view()),

    path('teams/<int:team_id>/datadomains/', TeamDataDomainListView.as_view()),
    path('users/<int:user_id>/toggle-status/', ToggleUserStatusView.as_view()),

    
]