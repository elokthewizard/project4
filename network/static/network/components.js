const App = () => {
    const [profile, setProfile] = React.useState(null);
    const {view, setView} = useView();

    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    const loggedInUser = document.getElementById('data-urls').getAttribute('data-username');

    console.log(loggedInUser)
    
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

    const handleUsernameClick = async (event, username, urls, GetRequest, setProfile) => {
        event.preventDefault()
        setView("ViewProfile");
        const userProfileUrl = urls.getUserProfile.replace('username_placeholder', username)
        const data = await GetRequest(userProfileUrl);
        setProfile(data);
    }

    return (
    <div>
        {isAuthenticated && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        {view === "DefaultFeed" && <AllPostsFeed GetRequest={GetRequest} urls={urls} setProfile={setProfile} handleUsernameClick={handleUsernameClick} loggedInUser={loggedInUser} />}
        {view === "FollowingFeed" && <FollowingFeed GetRequest={GetRequest} urls={urls} setProfile={setProfile} handleUsernameClick={handleUsernameClick} loggedInUser={loggedInUser} />}
        {view === "ViewProfile" && profile && <UserProfile urls={urls} profile={profile} setProfile={setProfile} handleUsernameClick={handleUsernameClick} loggedInUser={loggedInUser} />}
        
    </div>
    )
}

const useView = () => {
    const [view, setView] = React.useState("DefaultFeed");
    return { view, setView };
}

const useFetchPosts = (GetRequest, url, currentPage) => {
    const [posts, setPosts] = React.useState([]);
    const [totalPages, setTotalPages] = React.useState(1);

    React.useEffect(() => {
        const fetchPosts = async () => {
            const data = await GetRequest(`${url}?page=${currentPage}`);
            if (data) {
                setPosts(data.posts);
                setTotalPages(data.pages)
            } else {
                console.error("Failed to fetch posts");
            }
        };
        fetchPosts();
    }, [GetRequest, url, currentPage])

    return { posts, totalPages };
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

const Feed = ({ posts, urls, GetRequest, setProfile, handleUsernameClick, loggedInUser }) => {
    const editPost = (postId) => {
        console.log(`Editing post with ID: ${postId}`);
        // Your editing logic...
    };

    console.log("FEED: " + loggedInUser)
    
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
                    {post.author.toLowerCase() === loggedInUser.toLowerCase() && (
                        <button onClick={()=> editPost(post.id)}>Edit</button>
                    )}
                </div>
            ))}
        </div>
    )
}

const AllPostsFeed = ({GetRequest, urls, setProfile, handleUsernameClick, loggedInUser}) => {
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getAllPosts, currentPage);
    const [currentPage, setCurrentPage] = React.useState(1);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    }

    return (
        <div>
            <Feed 
                posts={posts} 
                urls={urls} 
                GetRequest={GetRequest} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick}
                loggedInUser={loggedInUser}
            />
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange}
            />
        </div>
    )
}

const FollowingFeed = ({GetRequest, urls, setProfile, handleUsernameClick, loggedInUser}) => {
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getFollowingPosts, currentPage);
    const [currentPage, setCurrentPage] = React.useState(1);

    return (
        <div>
            <Feed posts={posts} urls={urls} GetRequest={GetRequest} setProfile={setProfile} handleUsernameClick={handleUsernameClick} loggedInUser={loggedInUser}/>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
    )
}

const UserProfile = ({urls, profile, setProfile, handleUsernameClick, loggedInUser}) => {
    if (!profile) return <div>Loading...</div>;

    return (
    <div>
        <h1>{profile.username}</h1>
        <p>Followers: {profile.followers.length}</p>
        <p>Following: {profile.following.length}</p>
        <div>
            <h2>Posts</h2>
            <Feed posts={profile.posts} urls={urls} GetRequest={GetRequest} setProfile={setProfile} handleUsernameClick={handleUsernameClick} loggedInUser={loggedInUser}/>
        </div>
    </div>
    )
}

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
                Previous
            </button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                Next
            </button>
        </div>
    );
};


ReactDOM.render(<App />, document.getElementById('root'));
