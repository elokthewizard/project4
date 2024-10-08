function GetRequest(url, postData = null)
{
    // if post data was passed, POST
    if (data != null)
    {
        fetch(url,
        {
            method: "POST",
            body: JSON.stringify(postData),
            headers: 
            {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie(csrfToken)
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data)
        })
        .catch(error => {
            console.error("Error:", error)
        })
    }
    // otherwise GET
    else
    {
        fetch(url,
        {
            headers: 
            {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
        })
        .catch(error => {
            console.error("Error:", error)
        })
    }
}

function MakeNewPost(event)
{
    // Prevent default, send form data to endpoint
    event.preventDefault();

    postData = {
        postBody: document.querySelector('#postBody').value,
    }

    GetRequest("{% url 'make-new-post' %}", postData);
}

function GetAllPosts()
{
    GetRequest("{% url 'get-all-posts' %}");
}

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