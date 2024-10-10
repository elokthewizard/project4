const App = () => {
    const [profile, setProfile] = React.useState(null);
    const {view, setView} = useView();
    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    
    React.useEffect(() => {
        const navbar = document.querySelector('.navbar-nav');

        const handleNavBarClick = (event) => {
            event.preventDefault();
            const targetId = event.target.id;

            if (targetId === 'all-posts-link') {
                setView("DefaultFeed");
            } else if (targetId === 'following-link') {
                setView("FollowingFeed");
            }
        }

        if (navbar) {
            navbar.addEventListener("click", handleNavBarClick)
        }

        return () => {
            if (navbar) {
                navbar.removeEventListener('click', handleNavBarClick)
            }
        }
    }, [setView])

    return (
    <div>
        {isAuthenticated && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        {view === "DefaultFeed" && <AllPostsFeed GetRequest={GetRequest} urls={urls} setProfile={setProfile}/>}
        {view === "FollowingFeed" && <FollowingFeed GetRequest={GetRequest} urls={urls} setProfile={setProfile}/>}
        {view === "ViewProfile" && profile && <UserProfile urls={urls} profile={profile} setProfile={setProfile}/>}
        
    </div>
    )
}

const useView = () => {
    const [view, setView] = React.useState("DefaultFeed");
    return { view, setView };
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

const handleUsernameClick = async (event, username, urls, GetRequest, setProfile) => {
    event.preventDefault()
    const userProfileUrl = urls.getUserProfile.replace('username_placeholder', username)
    const data = await GetRequest(userProfileUrl);
    setProfile(data);
}

const Feed = ({ posts, urls, GetRequest, setProfile }) => {
    return (
        <div>
            {posts.map((post, index) => (
                <div key={index}>
                    <a 
                        href="#" 
                        onClick={(event) => handleUsernameClick(event, post.author, urls, GetRequest, setProfile)}
                    >@{post.author}</a>
                    <p>{post.body}</p>
                    <small>{new Date(post.time).toLocaleString()}</small>
                    <small>Likes: {post.liked_by.length}</small>
                </div>
            ))}
        </div>
    )
}

const AllPostsFeed = ({GetRequest, urls, setProfile}) => {
    const posts = useFetchPosts(GetRequest, urls.getAllPosts);

    return (
        <Feed posts={posts} urls={urls} GetRequest={GetRequest} setProfile={setProfile}/>
    )
}

const FollowingFeed = ({GetRequest, urls, setProfile}) => {
    const posts = useFetchPosts(GetRequest, urls.getFollowingPosts);

    return (
        <Feed posts={posts} urls={urls} GetRequest={GetRequest} setProfile={setProfile}/>
    )
}

const UserProfile = ({urls, profile, setProfile}) => {
    if (!profile) return <div>Loading...</div>;

    return (
    <div>
        <h1>{profile.username}</h1>
        <p>Followers: {profile.followers.length}</p>
        <p>Following: {profile.following.length}</p>
        <div>
            <h2>Posts</h2>
            <Feed posts={profile.posts} urls={urls} GetRequest={GetRequest} setProfile={setProfile} />
        </div>
    </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));
