from django.contrib.auth.models import AbstractUser
from django.db import models
from django.forms import ModelForm


class User(AbstractUser):
    bio = models.CharField(max_length=128, blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='following_users', blank=True)
    followed_by = models.ManyToManyField('self', symmetrical=False, related_name='followed_by_users', blank=True)

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField(max_length=128)
    time = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(User, blank=True, related_name="liked_by")

    def __str__(self):
        return f'{self.user.username}: {self.content[:20]}'
    
class PostForm(ModelForm):
    class Meta:
        model = Post
        exclude = ["liked_by"]