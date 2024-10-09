const App = () => {
    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    console.log(urls);
    return (
    <div>
        <NewPostForm GetRequest={GetRequest} urls={urls}/>
    </div>
    )
}

const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const GetRequest = (url, postData = null) =>
{
    // if post data was passed, POST
    if (postData != null)
    {
        fetch(url,
        {
            method: "POST",
            body: JSON.stringify(postData),
            headers: 
            {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrfToken')
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

const NewPostForm = ({GetRequest, urls}) => {
    const MakeNewPost = (event) => {
        event.preventDefault();

        const postData = {
            postBody: document.querySelector('#postBody').value
        }

        GetRequest(urls.makeNewPost, postData);
    }
    return (
        <div>
            <form onSubmit={MakeNewPost}>
                <input type="text" id="postBody" name="postBody" />
                <button type="submit">Post</button>
            </form>
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));
