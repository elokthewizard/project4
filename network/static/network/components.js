const App = () => {
    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    
    return (
    <div>
        {isAuthenticated && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        <AllPostsFeed GetRequest={GetRequest} urls={urls} />
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
    const options = {
        headers: {
            'Content-Type': 'application/json'
        },
    };

    // if post data was passed, POST
    if (postData != null) {
        options.nmethod = "POST"
        options.body = JSON.stringify(postData);
        options.headers['X-CSRFToken'] = getCookie('csrfToken');
    }
    // otherwise GET
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Bad network response')
            }
            return response.json();
        })
        .catch(error => {
            console.error("Error:", error);
        })
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

const AllPostsFeed = ({GetRequest, urls}) => {
    const[posts, setPosts] = React.useState([]);

    
    React.useEffect(() => {
        const fetchPosts = async () => {
            const data = await GetRequest(urls.getAllPosts)
            console.log(data)
            if (data) 
            {
                setPosts(data)
            }
            else
            {
                console.error("Failed to fetch posts")
            }
        }
        fetchPosts();
    }, [GetRequest, urls.getAllPosts]);

    return (
        <div>
            {posts.map((post, index) => (
                <div key={index}>
                    <h2>@{post.author}</h2>
                    <p>{post.body}</p>
                    <small>{new Date(post.time).toLocaleString()}</small>
                </div>
            ))}
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));
