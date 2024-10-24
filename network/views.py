from django.contrib.auth import authenticate, login, logout
from django.core import serializers
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import *


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
def make_new_post(request):
    if request.method == 'POST':
        # Handle the creation of a new post
        data = json.loads(request.body)
        post_body = data.get('postBody', '')

        if request.user.is_authenticated and post_body:
            post = Post(author=request.user, body=post_body)
            post.save()
            return JsonResponse({'message': 'Post created successfully'})
        else:
            return JsonResponse({'error': 'Authentication required or empty post body'}, status=400)
        
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_all_posts(request):
    if request.method == 'GET':
        posts_list = Post.objects.select_related('author').order_by('-time').all()
        paginator = Paginator(posts_list, 10)

        page_number = request.GET.get('page')
        posts = paginator.get_page(page_number)

        posts_data = [
            {
                "id": post.pk,
                "author": post.author.username,
                "body": post.body,
                "time": post.time,
                "liked_by": [user.username for user in post.liked_by.all()]
            }
            for post in posts
        ]

        response_data = {
            'posts': posts_data,
            'page': posts.number,
            'pages': posts.paginator.num_pages
        }
        return JsonResponse(response_data, safe=False)
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_following_posts(request):
    if request.method == 'GET':
        print(f"user: {request.user.username}")
        user = request.user
        following_users = user.following.all()
        print(f"is following: {following_users}")
        posts_list = Post.objects.filter(author__in=following_users).select_related('author').order_by('-time')
        print(f"lists: {posts_list}")

        paginator = Paginator(posts_list, 10)

        page_number = request.GET.get('page')
        posts = paginator.get_page(page_number)

        posts_data = [
            {
                "id": post.pk,
                "author": post.author.username,
                "body": post.body,
                "time": post.time,
                "liked_by": [user.username for user in post.liked_by.all()]
            } for post in posts
        ]
        print(f"post_data: {posts_data}")

        response_data = {
            'posts': posts_data,
            'page': posts.number,
            'pages': posts.paginator.num_pages
        }
        return JsonResponse(response_data, safe=False)
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_user_profile(request, username):
    if request.method == 'GET':
        # Handle fetching a user's profile
        user = User.objects.get(username=username)
        posts_list = Post.objects.filter(author=user)
        paginator = Paginator(posts_list, 10)

        page_number = request.GET.get('page')
        posts = paginator.get_page(page_number)

        posts_data = [
            {
                "id": post.pk,
                "author": post.author.username,
                "body": post.body,
                "time": post.time,
                "liked_by": [user.username for user in post.liked_by.all()]
            }
            for post in posts
        ]

        is_following = request.user in user.followed_by.all()

        response_data = {
            "username": user.username,
            "followers": list(user.followed_by.all().values('username')),
            "following": list(user.following.all().values('username')),
            "isFollowing": is_following,
            "posts": posts_data,
            "page": posts.number,
            "pages": posts.paginator.num_pages
        }

        return JsonResponse(response_data, safe=False)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def edit_post(request, id):
    if request.method == "GET":
        try:
            post = Post.objects.get(pk=id, author=request.user)
            post_data = {
                "id": post.pk,
                "author": post.author.username,
                "body": post.body,
                "time": post.time,
                "liked_by": [user.username for user in post.liked_by.all()]
            }
        
            print(post_data)

            return JsonResponse(post_data, safe=False)
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found/ unauthorized request'}, status=404)
    
    if request.method == 'POST':
        # Handle editing a post
        try:
            data = json.loads(request.body)
            post_body = data.get('postBody', '')

            if request.user.is_authenticated and post_body:
                post = Post.objects.get(pk=id, author=request.user)
                post.body = post_body
                post.save()
                return JsonResponse({'message': 'Post updated successfully'})
            else:
                return JsonResponse({'error': 'Authentication required/ empty post body'})
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found or invalid data'}, status=404)
        
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def like_post(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            post_id = data.get('postId')
            post = Post.objects.get(pk=post_id)
            if (request.user in post.liked_by.all()):
                post.liked_by.remove(request.user)
                message = "Post unliked successfully"
            else:
                post.liked_by.add(request.user)
                message = "Post liked successfully"
            post.save()
            liked_by_usernames = [user.username for user in post.liked_by.all()]
            updated_like_count = post.liked_by.count()
            return JsonResponse({
                'message': message, 
                'liked_by': liked_by_usernames,
                'updated_like_count': updated_like_count
            })
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
        except (json.JSONDecodeError, KeyError):
            return JsonResponse({'error': 'Invalid data'}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def follow_user(request, username):
    if request.method == 'POST':
        try:
            user_to_follow = User.objects.get(username=username)
            if user_to_follow in request.user.following.all():
                user_to_follow.followed_by.remove(request.user)
                request.user.following.remove(user_to_follow)
                message = 'Unfollowed successfully'
            else:
                user_to_follow.followed_by.add(request.user)
                request.user.following.add(user_to_follow)
                message = 'Followed successfully'
            
            updated_followers_list = list(user_to_follow.followed_by.all().values_list('username', flat=True))
            updated_following_list = list(user_to_follow.following.all().values_list('username', flat=True))

            return JsonResponse({
                'message': message,
                'updatedFollowers': updated_followers_list,
                'updatedFollowing': updated_following_list
            })
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
    return JsonResponse({'error': 'Invalid request'}, status=400)