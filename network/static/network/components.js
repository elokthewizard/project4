const App = () => {
    const [profile, setProfile] = React.useState(null);
    const {view, setView} = useView();

    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    const loggedInUser = document.getElementById('data-urls').getAttribute('data-username');
    
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
        const userProfileUrl = urls.getUserProfile.replace('username_placeholder', username)
        const data = await GetRequest(userProfileUrl);
        setProfile(data);
        setView("ViewProfile");
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    }

    const editPost = async (postId) => {
        console.log(`Editing post with ID: ${postId}`);
        const postIdUrl = urls.editPost.replace('post_id_placeholder', postId)
        const data = await GetRequest(postIdUrl);
        console.log('');
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                console.log(`${key}: ${data[key]}`)
            }
        }
        console.log('');
    };

    return (
    <div>
        {isAuthenticated && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        {view === "DefaultFeed" &&  
            <AllPostsFeed 
                GetRequest={GetRequest} 
                urls={urls} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                loggedInUser={loggedInUser} 
                editPost={editPost}
            />}
        {view === "FollowingFeed" && 
            <FollowingFeed 
                GetRequest={GetRequest} 
                urls={urls} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                loggedInUser={loggedInUser} 
                editPost={editPost}
            />}
        {view === "ViewProfile" && profile && 
            <UserProfile 
                GetRequest={GetRequest} 
                urls={urls} 
                profile={profile} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                loggedInUser={loggedInUser} 
                editPost={editPost}
            />}
        
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

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
    const handlePrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
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

const Feed = ({ posts, urls, GetRequest, setProfile, handleUsernameClick, loggedInUser, editPost }) => {
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

const AllPostsFeed = ({GetRequest, urls, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost}) => {
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getAllPosts, currentPage);
    const [currentPage, setCurrentPage] = React.useState(1);

    return (
        <div>
            <Feed 
                posts={posts} 
                urls={urls} 
                GetRequest={GetRequest} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick}
                loggedInUser={loggedInUser}
                editPost={editPost}
            />
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handlePageChange={handlePageChange}
            />
        </div>
    )
}

const FollowingFeed = ({GetRequest, urls, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost}) => {
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getFollowingPosts, currentPage);
    const [currentPage, setCurrentPage] = React.useState(1);

    return (
        <div>
            <Feed 
                posts={posts} 
                urls={urls} 
                GetRequest={GetRequest} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                loggedInUser={loggedInUser}
                editPost={editPost}
            />
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handlePageChange={handlePageChange} 
            />
        </div>
    )
}

const UserProfile = ({urls, profile, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost}) => {
    const [currentPage, setCurrentPage] = React.useState(1);

    if (!profile) return <div>Loading...</div>;
    // const { posts, totalPages } = useFetchPosts(GetRequest, urls.getUserProfile, currentPage);
    

    return (
    <div>
        <h1>{profile.username}</h1>
        <p>Followers: {profile.followers.length}</p>
        <p>Following: {profile.following.length}</p>
        <div>
            <h2>Posts</h2>
            <Feed 
                posts={profile.posts} 
                urls={urls} 
                GetRequest={GetRequest} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                loggedInUser={loggedInUser}
                editPost={editPost}
            />
            <Pagination 
                currentPage={profile.page} 
                totalPages={profile.pages} 
                handlePageChange={handlePageChange} 
            />
        </div>
    </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));
