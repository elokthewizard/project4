from django.contrib.auth import authenticate, login, logout
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
            print(f'New post by {request.user.username}: {post_body}')
            # post = Post(author=request.user, body=post_body)
            # post.save()
            return JsonResponse({'message': 'Post created successfully'})
        else:
            return JsonResponse({'error': 'Authentication required or empty post body'}, status=400)
        
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_all_posts(request):
    if request.method == 'GET':
        # Handle fetching all posts
        return JsonResponse({'posts': []})
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_following_posts(request):
    if request.method == 'GET':
        # Handle fetching posts from followed users
        return JsonResponse({'posts': []})
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_user_profile(request):
    if request.method == 'GET':
        # Handle fetching a user's profile
        return JsonResponse({'profile': {}})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def edit_post(request):
    if request.method == 'POST':
        # Handle editing a post
        return JsonResponse({'message': 'Post edited successfully'})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def like_post(request):
    if request.method == 'POST':
        # Handle liking a post
        return JsonResponse({'message': 'Post liked successfully'})
    return JsonResponse({'error': 'Invalid request'}, status=400)