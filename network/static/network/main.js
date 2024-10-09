

function GetFollowingPosts()
{
    GetRequest("{% url 'get-following-posts' %}")
}

function GetUserProfile()
{
    GetRequest("{% url 'get-user-profile' %}")
}

function EditPost()
{
    GetRequest("{% url 'edit-post' %}")
}

function LikePost()
{
    GetRequest("{% url 'like-post' %}")
}