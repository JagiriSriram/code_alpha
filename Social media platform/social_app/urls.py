from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('api/auth/register', views.register_user, name='api_register'),
    path('api/auth/login', views.login_user, name='api_login'),
    path('api/auth/logout', views.logout_user, name='api_logout'),
    path('api/auth/me', views.get_current_user, name='api_me'),
    
    # User / Profile endpoints
    path('api/users/suggestions', views.get_follow_suggestions, name='api_suggestions'),
    path('api/users/profile', views.update_profile, name='api_update_profile'),
    path('api/users/search', views.search_users, name='api_search_users'),
    path('api/users/<str:username>', views.get_profile, name='api_get_profile'),
    path('api/users/<int:user_id>/follow', views.toggle_follow, name='api_toggle_follow'),
    
    # Posts endpoints
    path('api/posts', views.feed_posts, name='api_feed_posts'),
    path('api/posts/create', views.create_post, name='api_create_post'),
    path('api/posts/<int:post_id>', views.delete_post, name='api_delete_post'),
    path('api/posts/<int:post_id>/like', views.toggle_like, name='api_toggle_like'),
    
    # Comments endpoints
    path('api/posts/<int:post_id>/comments', views.get_comments, name='api_get_comments'),
    path('api/posts/<int:post_id>/comments/add', views.add_comment, name='api_add_comment'),
    path('api/comments/<int:comment_id>', views.delete_comment, name='api_delete_comment'),
]
