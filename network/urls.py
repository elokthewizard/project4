
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('make-new-post/', views.make_new_post, name='make-new-post'),
    path('get-all-posts/', views.get_all_posts, name='get-all-posts'),
    path('get-following-posts/', views.get_following_posts, name='get-following-posts'),
    path('get-user-profile/<str:username>/', views.get_user_profile, name='get-user-profile'),
    path('edit-post/<int:id>', views.edit_post, name='edit-post'),
    path('like-post', views.like_post, name='like-post'),
    path('follow-user/<str:username>', views.follow_user, name='follow-user')
]