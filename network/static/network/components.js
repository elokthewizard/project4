const App = () => {
    const [profile, setProfile] = React.useState(null);
    const {view, setView} = useView();

    const [currentPostId, setCurrentPostId] = React.useState(null)
    const [postToEdit, setPostToEdit] = React.useState(null)
    const [postLikes, setPostLikes] = React.useState({})

    const urls = JSON.parse(document.getElementById('data-urls').getAttribute('data-urls'));
    const isAuthenticated = document.getElementById('data-urls').getAttribute('data-authenticated') === 'true';
    const loggedInUser = document.getElementById('data-urls').getAttribute('data-username');
    
    React.useEffect(() => {
        const navbar = document.querySelector('.navbar-nav');

        const handleNavBarClick = (event) => {
            const targetId = event.target.id;

            if (targetId === "all-posts-link" || targetId === "following-link") {
                event.preventDefault();
                if (targetId === 'all-posts-link') {
                    setView("DefaultFeed");
                } else if (targetId === 'following-link') {
                    setView("FollowingFeed");
                }
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

    const handleLikePost = async (postId) => {
        const likePostUrl = urls.likePost;
        const response = await GetRequest(likePostUrl, { postId });
        console.log(response.message);

        const updatedLikeCount = response.updated_like_count

        console.log(updatedLikeCount)

        setPostLikes(prevPostLikes => ({
            ...prevPostLikes,
            [postId]: updatedLikeCount
        }));
        console.log(`Post with id ${postId} has ${updatedLikeCount} likes`);  // Log the update
    };
    

    const editPost = async (postId) => {
        console.log(`Editing post with ID: ${postId}`);
        const postIdUrl = urls.editPost.replace('post_id_placeholder', postId)
        const data = await GetRequest(postIdUrl);

        setPostToEdit(data);
        setView("EditPost");
    };

    return (
    <div>
        {isAuthenticated && view != "EditPost" && <NewPostForm GetRequest={GetRequest} urls={urls}/>}

        {view === "DefaultFeed" &&  
            <AllPostsFeed 
                GetRequest={GetRequest} 
                urls={urls} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                handleLikePost={handleLikePost}
                loggedInUser={loggedInUser} 
                editPost={editPost}
                postLikes={postLikes}
            />
        }
        {view === "FollowingFeed" && 
            <FollowingFeed 
                GetRequest={GetRequest} 
                urls={urls} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                handleLikePost={handleLikePost}
                loggedInUser={loggedInUser} 
                editPost={editPost}
                postLikes={postLikes}
            />
        }
        {view === "ViewProfile" && profile && 
            <UserProfile 
                GetRequest={GetRequest} 
                urls={urls} 
                profile={profile} 
                setProfile={setProfile} 
                handleUsernameClick={handleUsernameClick} 
                handlePageChange={handlePageChange}
                handleLikePost={handleLikePost}
                loggedInUser={loggedInUser} 
                editPost={editPost}
                postLikes={postLikes}
            />
        }
        {view === "EditPost" && postToEdit &&
            <EditPostForm
                GetRequest={GetRequest}
                urls={urls}
                postToEdit={postToEdit}
                setView={setView}
            />
        }
        
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
        options.method = "POST"
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
        window.location.reload()
        
    }
    return (
        <div className="form-container">
            <form className="new-post-form" onSubmit={MakeNewPost}>
            <textarea 
                id="postBody" 
                name="postBody" 
                rows="4" 
                cols="64">    
            </textarea>
                <button className="post-button" type="submit">Post</button>
            </form>
        </div>
    )
}

const EditPostForm = ({GetRequest, urls, postToEdit, setView}) => {
    const [postBody, setPostBody] = React.useState(postToEdit.body);

    const handleEditPost = async (event) => {
        event.preventDefault();
        const postIdUrl = urls.editPost.replace('post_id_placeholder', postToEdit.id)
        const response = await GetRequest(postIdUrl, {
            postBody
        })
        setView("DefaultFeed");
    }
    return (
        <div className="form-container">
            <form className="edit-post-form" onSubmit={handleEditPost}>
                <textarea 
                    type="text"
                    id="postBody"
                    name="postBody"
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    rows="4" cols="64">
                </textarea>
                <button className="post-button" type="submit">Update post</button>
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

const Feed = ({ posts, urls, GetRequest, setProfile, handleUsernameClick, loggedInUser, editPost, handleLikePost, postLikes }) => {
    return (
        <div className="feed">
            {posts.map((post, index) => (
                <div key={index} id={`post-${post.id}`} className="post">
                    <div className="post-header">
                        <a
                            className="username-link"
                            href="#"
                            onClick={(event) => handleUsernameClick(event, post.author, urls, GetRequest, setProfile, postLikes)}
                        >@{post.author}</a>
                        {post.author.toLowerCase() === loggedInUser.toLowerCase() && (
                            <button type="button" className="edit-button" onClick={()=> editPost(post.id)}>Edit</button>
                        )}
                    </div>
                    <p className="post-body">{post.body}</p>
                    <div className="post-info">
                        <small>{new Date(post.time).toLocaleString()}</small>
                        <small className="like-count">Likes: {postLikes[post.id] !== undefined ? postLikes[post.id] : post.liked_by.length}</small>
                        <button className="like-button" onClick={() => handleLikePost(post.id)}>Like</button>
                    </div>
                    
                    
                </div>
            ))}
        </div>
    )
}

const AllPostsFeed = ({GetRequest, urls, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost, handleLikePost, postLikes}) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getAllPosts, currentPage);

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
                handleLikePost={handleLikePost}
                postLikes={postLikes}
            />
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handlePageChange={handlePageChange}
            />
        </div>
    )
}

const FollowingFeed = ({GetRequest, urls, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost, handleLikePost, postLikes}) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const { posts, totalPages } = useFetchPosts(GetRequest, urls.getFollowingPosts, currentPage);

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
                handleLikePost={handleLikePost}
                postLikes={postLikes}
            />
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handlePageChange={handlePageChange} 
            />
        </div>
    )
}

const UserProfile = ({urls, profile, setProfile, handleUsernameClick, handlePageChange, loggedInUser, setView, editPost, handleLikePost, postLikes}) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isFollowing, setIsFOllowing] = React.useState(profile.isFollowing)

    if (!profile) return <div>Loading...</div>;

    const handleFollowUser = async () => {
        const followUrl = urls.followUser.replace('username_placeholder', profile.username)
        const response = await GetRequest(followUrl, {userId: loggedInUser}) 

        const updatedFollowers = response.updatedFollowers;
        const updatedFollowing = response.updatedFollowing;

        setProfile(prevProfile => ({
            ...prevProfile,
            isFollowing: !prevProfile.isFollowing,
            followers: updatedFollowers,
            following: updatedFollowing
        }))
    }

    return (
    <div>
        <h1>@{profile.username}</h1>
        <div className="profile-info">
            <p>Followers: {profile.followers.length}</p>
            <p>Following: {profile.following.length}</p>
        </div>
        {loggedInUser && loggedInUser !== profile.username && (
            <button type="button" onClick={handleFollowUser}>
                {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
        )}
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
                handleLikePost={handleLikePost}
                postLikes={postLikes}
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
