const App = () => {
    const [profile, setProfile] = React.useState(null);
    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    
    return (
    <div>
        {isAuthenticated && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        <AllPostsFeed GetRequest={GetRequest} urls={urls} setProfile={setProfile}/>
        {profile && <UserProfile profile={profile} />}
        
    </div>
    )
}

const useFetchPosts = (GetRequest, url) => {
    const [posts, setPosts] = React.useState([]);

    React.useEffect(() => {
        const fetchPosts = async () => {
            const data = await GetRequest(url);
            if (data) {
                setPosts(data);
            } else {
                console.error("Failed to fetch posts");
            }
        };
        fetchPosts();
    }, [GetRequest, url])

    return posts;
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

const AllPostsFeed = ({GetRequest, urls, setProfile}) => {
    const posts = useFetchPosts(GetRequest, urls.getAllPosts);

    const handleUsernameClick = async (event, username) => {
        event.preventDefault()
        const userProfileUrl = urls.getUserProfile.replace('username_placeholder', username)
        const data = await GetRequest(userProfileUrl);
        setProfile(data);
    }

    return (
        <div>
            {posts.map((post, index) => (
                <div key={index}>
                    <a href={`${urls.getUserProfile.replace('/username_placeholder', post.author)}`}
                    onClick = {(event) => {
                        handleUsernameClick(event, post.author);
                    }}>@{post.author}</a>
                    <p>{post.body}</p>
                    <small>{new Date(post.time).toLocaleString()}</small>
                    <small>Likes: {post.liked_by.length}</small>
                </div>
            ))}
        </div>
    )
}



const UserProfile = ({profile}) => {
    if (!profile) return <div>Loading...</div>;

    return (
    <div>
        <h1>{profile.username}</h1>
        <p>Followers: {profile.followers.length}</p>
        <p>Following: {profile.following.length}</p>
        <div>
            <h2>Posts</h2>
            {profile.posts.map((post, index) => (
                <div key={index}>
                    <p>{post.body}</p>
                    <small>{new Date(post.time).toLocaleString()}</small>
                    <small>Likes: {post.liked_by.length}</small>
                </div>
            ))}
        </div>
    </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));
