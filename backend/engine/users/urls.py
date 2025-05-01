from django.urls import path
from .views import RegisterView, LoginView, UserView, GitHubOAuthView, BulkCreateUsersView, TeamUsersView

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login', LoginView.as_view()),
    path('user', UserView.as_view()),
    path('oauth/github/', GitHubOAuthView.as_view()),
    path('admin/new', BulkCreateUsersView.as_view()),
    path('teams/<int:team_id>/users/', TeamUsersView.as_view()),
    
]