// Client-side Application State
let currentUser = null;
let currentView = 'home'; // 'home', 'explore', 'profile'
let currentFeedType = 'global'; // 'global', 'followed'
let viewingProfileUsername = '';
let activeProfileTab = 'posts'; // 'posts', 'liked'
let uploadPostFile = null;
let uploadQuickPostFile = null;
let editAvatarFile = null;
let editCoverFile = null;

// API Helper - Performs fetch calls with uniform JSON or form-data handling
async function apiFetch(url, options = {}) {
    // Note: Django session cookies are automatically sent and received by the browser
    // since both frontend and backend are served from the same origin.
    
    // Default headers for JSON payloads (if not form-data)
    if (options.body && !(options.body instanceof FormData)) {
        if (!options.headers) options.headers = {};
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API Fetch Error [${url}]:`, error);
        showToast(error.message || 'Something went wrong', 'error');
        throw error;
    }
}

// Relative time formatter (e.g. "5m ago")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Automatically remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
    lucide.createIcons();
});

// Check Authentication Status
async function checkAuth() {
    try {
        const data = await apiFetch('/api/auth/me');
        const loader = document.getElementById('app-loader');
        
        if (data.authenticated) {
            currentUser = data.user;
            updateCurrentUserUI();
            showView('home');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            loadWhoToFollow();
        } else {
            currentUser = null;
            document.getElementById('app-screen').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
        }
        
        // Hide Loader
        loader.style.opacity = '0';
        setTimeout(() => loader.classList.add('hidden'), 500);
    } catch (e) {
        document.getElementById('app-loader').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    }
}

// Update Local User Elements (Sidebar, creators, previews)
function updateCurrentUserUI() {
    if (!currentUser) return;
    
    document.getElementById('sidebar-avatar').src = currentUser.avatar;
    document.getElementById('sidebar-display-name').textContent = currentUser.display_name;
    document.getElementById('sidebar-username').textContent = `@${currentUser.username}`;
    
    const creatorAvatar = document.getElementById('creator-avatar');
    if (creatorAvatar) creatorAvatar.src = currentUser.avatar;
}

// --- SCREEN ROUTING ---
function showView(viewName, params = {}) {
    currentView = viewName;
    
    // Hide all view panels
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Activate clicked nav item
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');
    
    const viewTitle = document.getElementById('view-title');
    
    if (viewName === 'home') {
        viewTitle.textContent = 'Home Feed';
        document.getElementById('view-home').classList.remove('hidden');
        loadFeedPosts();
    } else if (viewName === 'profile') {
        const username = params.username || currentUser.username;
        viewingProfileUsername = username;
        viewTitle.textContent = `@${username}'s Profile`;
        document.getElementById('view-profile').classList.remove('hidden');
        loadProfileDetails(username);
    } else if (viewName === 'explore') {
        viewTitle.textContent = 'Explore Connectify';
        document.getElementById('view-explore').classList.remove('hidden');
        document.getElementById('explore-search-input').value = '';
        renderSearchResults([]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
}

// --- FETCH & LOAD FUNCTIONS ---

// Load Feed Posts (Global or Following feed)
async function loadFeedPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '<div class="loader-spinner" style="margin: 40px auto;"></div>';
    
    try {
        const url = `/api/posts?feed=${currentFeedType}`;
        const data = await apiFetch(url);
        
        container.innerHTML = '';
        if (data.posts.length === 0) {
            container.innerHTML = `
                <div class="post-card" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i data-lucide="radio" style="width: 48px; height: 48px; margin: 0 auto 12px auto; color: var(--text-muted);"></i>
                    <p>No posts in this feed yet. Be the first to share your account!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        renderPosts(container, data.posts);
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:red;">Failed to load feed posts.</p>';
    }
}

// Load Profile Stats and User Info
async function loadProfileDetails(username) {
    try {
        const profile = await apiFetch(`/api/users/${username}`);
        
        // Populate profile page
        document.getElementById('profile-avatar').src = profile.avatar;
        document.getElementById('profile-cover').src = profile.cover_image;
        document.getElementById('profile-display-name').textContent = profile.display_name;
        document.getElementById('profile-username').textContent = `@${profile.username}`;
        document.getElementById('profile-bio').textContent = profile.bio || "No bio set yet.";
        document.getElementById('profile-stat-posts').textContent = profile.posts_count;
        document.getElementById('profile-stat-followers').textContent = profile.followers_count;
        document.getElementById('profile-stat-following').textContent = profile.following_count;
        
        const editBtn = document.getElementById('edit-profile-btn');
        const followBtn = document.getElementById('follow-profile-btn');
        
        if (profile.is_self) {
            editBtn.classList.remove('hidden');
            followBtn.classList.add('hidden');
        } else {
            editBtn.classList.add('hidden');
            followBtn.classList.remove('hidden');
            
            // Set follow state
            if (profile.is_following) {
                followBtn.textContent = 'Following';
                followBtn.className = 'btn btn-outline';
            } else {
                followBtn.textContent = 'Follow';
                followBtn.className = 'btn btn-primary';
            }
            
            // Re-bind click with target user ID
            followBtn.onclick = () => handleFollowToggle(profile.id, followBtn, username);
        }
        
        loadProfilePosts(username);
    } catch (e) {
        showToast('Failed to load profile details', 'error');
    }
}

// Load posts belonging to or liked by a user on profile page
async function loadProfilePosts(username) {
    const container = document.getElementById('profile-posts-container');
    container.innerHTML = '<div class="loader-spinner" style="margin: 40px auto;"></div>';
    
    try {
        let url = `/api/posts?username=${username}`;
        if (activeProfileTab === 'liked') {
            url = `/api/posts?feed=liked`; // Note: backend liked feed lists posts liked by request.user
        }
        
        const data = await apiFetch(url);
        container.innerHTML = '';
        
        if (data.posts.length === 0) {
            container.innerHTML = `
                <div class="post-card" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i data-lucide="folder-open" style="margin: 0 auto 12px auto; color: var(--text-muted);"></i>
                    <p>No posts to display in this category.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        renderPosts(container, data.posts);
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:red;">Failed to load posts.</p>';
    }
}

// Load suggested followers
async function loadWhoToFollow() {
    const container = document.getElementById('who-to-follow-container');
    container.innerHTML = '';
    
    try {
        const data = await apiFetch('/api/users/suggestions');
        
        if (data.users.length === 0) {
            container.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">You follow everyone or no suggested accounts.</p>';
            return;
        }
        
        data.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'suggestion-row';
            
            row.innerHTML = `
                <a href="#" class="suggestion-user" data-username="${user.username}">
                    <img src="${user.avatar}" alt="Avatar" class="avatar-sm">
                    <div class="suggestion-user-info">
                        <span class="name">${user.display_name}</span>
                        <span class="username">@${user.username}</span>
                    </div>
                </a>
                <button class="btn btn-primary btn-follow-sm" data-id="${user.id}">Follow</button>
            `;
            
            // Add click to show profile
            row.querySelector('.suggestion-user').onclick = (e) => {
                e.preventDefault();
                showView('profile', { username: user.username });
            };
            
            // Add follow action
            const followBtn = row.querySelector('.btn-follow-sm');
            followBtn.onclick = () => handleFollowToggle(user.id, followBtn);
            
            container.appendChild(row);
        });
        
        lucide.createIcons();
    } catch (e) {
        console.error('Error loading recommendations:', e);
    }
}

// --- RENDER POSTS & INTERACTIONS ---

function renderPosts(container, posts) {
    posts.forEach(post => {
        const card = document.createElement('article');
        card.className = 'post-card';
        card.dataset.id = post.id;
        
        const isOwner = currentUser && post.author.id === currentUser.id;
        const deleteButtonHtml = isOwner 
            ? `<button class="btn-delete-post" title="Delete Post"><i data-lucide="trash-2"></i></button>`
            : '';
            
        const imageHtml = post.image 
            ? `<img src="${post.image}" alt="Post attachment" class="post-image">`
            : '';
            
        card.innerHTML = `
            <div class="post-header">
                <a href="#" class="post-author" data-username="${post.author.username}">
                    <img src="${post.author.avatar}" alt="${post.author.display_name}" class="avatar-md">
                    <div class="post-author-info">
                        <span class="name">${post.author.display_name}</span>
                        <span class="username">@${post.author.username}</span>
                    </div>
                </a>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="post-meta">${formatRelativeTime(post.created_at)}</span>
                    ${deleteButtonHtml}
                </div>
            </div>
            <div class="post-body">
                <p>${escapeHTML(post.content)}</p>
                ${imageHtml}
            </div>
            <div class="post-footer">
                <button class="post-action action-like ${post.is_liked ? 'liked' : ''}">
                    <i data-lucide="heart"></i>
                    <span class="like-count">${post.likes_count}</span>
                </button>
                <button class="post-action action-comment">
                    <i data-lucide="message-square"></i>
                    <span class="comment-count">${post.comments_count}</span>
                </button>
            </div>
            <div class="comments-panel hidden">
                <div class="comments-list">
                    <!-- Comments loaded dynamically -->
                </div>
                <div class="comment-input-row">
                    <input type="text" placeholder="Add a reply to this thread..." class="comment-input-field">
                    <button class="btn-send-comment"><i data-lucide="send"></i></button>
                </div>
            </div>
        `;
        
        // Link username/avatar clicks
        card.querySelector('.post-author').onclick = (e) => {
            e.preventDefault();
            showView('profile', { username: post.author.username });
        };
        
        // Delete post action
        if (isOwner) {
            card.querySelector('.btn-delete-post').onclick = () => handleDeletePost(post.id, card);
        }
        
        // Like toggle action
        const likeBtn = card.querySelector('.action-like');
        likeBtn.onclick = () => handleLikeToggle(post.id, likeBtn);
        
        // Comment toggle panel action
        const commentBtn = card.querySelector('.action-comment');
        const commentsPanel = card.querySelector('.comments-panel');
        commentBtn.onclick = () => toggleComments(post.id, commentsPanel);
        
        // Comment submission
        const commentInput = card.querySelector('.comment-input-field');
        const sendCommentBtn = card.querySelector('.btn-send-comment');
        
        sendCommentBtn.onclick = () => submitComment(post.id, commentInput, card);
        commentInput.onkeydown = (e) => {
            if (e.key === 'Enter') submitComment(post.id, commentInput, card);
        };
        
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

// Toggle Inline Comments Drawer
async function toggleComments(postId, panel) {
    const isHidden = panel.classList.contains('hidden');
    
    if (isHidden) {
        panel.classList.remove('hidden');
        await loadComments(postId, panel.querySelector('.comments-list'));
    } else {
        panel.classList.add('hidden');
    }
}

// Load comments lists
async function loadComments(postId, listContainer) {
    listContainer.innerHTML = '<div class="loader-spinner" style="width:20px; height:20px; margin: 10px auto;"></div>';
    
    try {
        const data = await apiFetch(`/api/posts/${postId}/comments`);
        listContainer.innerHTML = '';
        
        if (data.comments.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding: 10px; font-size:12px; color:var(--text-muted);">No comments yet. Start the conversation!</p>';
            return;
        }
        
        data.comments.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            
            const isCommentOwner = currentUser && comment.author.id === currentUser.id;
            const deleteCommentBtnHtml = isCommentOwner 
                ? `<button class="btn-delete-comment" title="Delete Comment"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>`
                : '';
                
            item.innerHTML = `
                <img src="${comment.author.avatar}" alt="Avatar" class="avatar-sm" style="width:30px; height:30px;">
                <div class="comment-bubble">
                    <div class="comment-bubble-header">
                        <span class="comment-author-name">${comment.author.display_name}</span>
                        <span class="comment-time">${formatRelativeTime(comment.created_at)}</span>
                    </div>
                    <span class="comment-content">${escapeHTML(comment.content)}</span>
                </div>
                ${deleteCommentBtnHtml}
            `;
            
            // Delete action
            if (isCommentOwner) {
                item.querySelector('.btn-delete-comment').onclick = () => handleDeleteComment(comment.id, item, postId);
            }
            
            listContainer.appendChild(item);
        });
        
        lucide.createIcons();
        
        // Scroll to the bottom of the comments drawer
        listContainer.scrollTop = listContainer.scrollHeight;
    } catch (e) {
        listContainer.innerHTML = '<p style="color:red; font-size:12px;">Failed to load replies.</p>';
    }
}

// Submit a new Comment
async function submitComment(postId, inputElement, postCard) {
    const content = inputElement.value.trim();
    if (!content) return;
    
    try {
        const data = await apiFetch(`/api/posts/${postId}/comments/add`, {
            method: 'POST',
            body: { content }
        });
        
        inputElement.value = '';
        showToast('Reply published', 'success');
        
        // Increment UI counter
        const countSpan = postCard.querySelector('.action-comment .comment-count');
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
        
        // Reload comments drawer
        const listContainer = postCard.querySelector('.comments-list');
        await loadComments(postId, listContainer);
    } catch (e) {
        console.error('Comment error:', e);
    }
}

// Delete Post
async function handleDeletePost(postId, postElement) {
    if (!confirm('Are you sure you want to incinerate this post? This cannot be undone.')) return;
    
    try {
        await apiFetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        });
        
        // Smoothly fade out post card
        postElement.style.transition = 'all 0.4s ease';
        postElement.style.opacity = '0';
        postElement.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            postElement.remove();
            showToast('Post deleted', 'success');
        }, 400);
    } catch (e) {
        console.error('Delete post error:', e);
    }
}

// Delete Comment
async function handleDeleteComment(commentId, commentElement, postId) {
    if (!confirm('Delete this comment reply?')) return;
    
    try {
        await apiFetch(`/api/comments/${commentId}`, {
            method: 'DELETE'
        });
        
        // Decrease post counter
        const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
        if (postCard) {
            const countSpan = postCard.querySelector('.action-comment .comment-count');
            countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
        }
        
        commentElement.remove();
        showToast('Comment deleted', 'success');
    } catch (e) {
        console.error('Delete comment error:', e);
    }
}

// Toggle Like
async function handleLikeToggle(postId, likeBtn) {
    try {
        const data = await apiFetch(`/api/posts/${postId}/like`, {
            method: 'POST'
        });
        
        const countSpan = likeBtn.querySelector('.like-count');
        countSpan.textContent = data.likes_count;
        
        if (data.liked) {
            likeBtn.classList.add('liked');
            // Mini scale animations
            likeBtn.style.transform = 'scale(1.2)';
            setTimeout(() => likeBtn.style.transform = 'scale(1)', 150);
        } else {
            likeBtn.classList.remove('liked');
        }
    } catch (e) {
        console.error('Like toggle error:', e);
    }
}

// Toggle Follow/Unfollow user
async function handleFollowToggle(userId, buttonElement, profileUsername = null) {
    try {
        buttonElement.disabled = true;
        const data = await apiFetch(`/api/users/${userId}/follow`, {
            method: 'POST'
        });
        
        buttonElement.disabled = false;
        
        if (data.following) {
            buttonElement.textContent = 'Following';
            buttonElement.className = 'btn btn-outline';
            showToast('Account followed', 'success');
        } else {
            buttonElement.textContent = 'Follow';
            buttonElement.className = 'btn btn-primary';
            showToast('Account unfollowed', 'info');
        }
        
        // If we are looking at the profile of the user we just followed/unfollowed, update the stats
        if (profileUsername && currentView === 'profile' && viewingProfileUsername === profileUsername) {
            document.getElementById('profile-stat-followers').textContent = data.followers_count;
        }
        
        // Refresh suggestions and feed posts if on the followed tab
        loadWhoToFollow();
        if (currentView === 'home' && currentFeedType === 'followed') {
            loadFeedPosts();
        }
    } catch (e) {
        buttonElement.disabled = false;
        console.error('Follow toggle error:', e);
    }
}

// Search users
async function handleSearch(query) {
    const resultsContainer = document.getElementById('search-users-results');
    
    if (!query.trim()) {
        renderSearchResults([]);
        return;
    }
    
    resultsContainer.innerHTML = '<div class="loader-spinner" style="grid-column: 1/-1; margin: 40px auto;"></div>';
    
    try {
        const data = await apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(data.users);
    } catch (e) {
        resultsContainer.innerHTML = '<p class="no-results-msg" style="color:red;">Error searching users.</p>';
    }
}

function renderSearchResults(users) {
    const resultsContainer = document.getElementById('search-users-results');
    resultsContainer.innerHTML = '';
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results-msg">No profiles match that query on Connectify.</p>';
        return;
    }
    
    users.forEach(user => {
        const card = document.createElement('a');
        card.href = '#';
        card.className = 'user-search-card';
        
        card.innerHTML = `
            <img src="${user.avatar}" alt="${user.display_name}" class="user-search-card avatar-lg">
            <div class="user-search-card-meta">
                <div class="name">${user.display_name}</div>
                <div class="username">@${user.username}</div>
            </div>
            <button class="btn ${user.is_following ? 'btn-outline' : 'btn-primary'} btn-follow-sm" style="width:100%; margin-top:8px;">
                ${user.is_following ? 'Following' : 'Follow'}
            </button>
        `;
        
        // Show profile when card clicked, except if button was clicked
        card.onclick = (e) => {
            if (e.target.closest('.btn-follow-sm')) return;
            e.preventDefault();
            showView('profile', { username: user.username });
        };
        
        const followBtn = card.querySelector('.btn-follow-sm');
        followBtn.onclick = (e) => {
            e.stopPropagation();
            handleFollowToggle(user.id, followBtn);
        };
        
        resultsContainer.appendChild(card);
    });
}

// --- EVENT LISTENERS CONFIGURATION ---
function setupEventListeners() {
    
    // Auth Toggles
    document.getElementById('show-signup').onclick = () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
        document.getElementById('auth-subtitle').textContent = 'Join the glowing network.';
    };
    
    document.getElementById('show-login').onclick = () => {
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('auth-subtitle').textContent = 'Enter the social stratosphere.';
    };
    
    // Login Form Submit
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: { username, password }
            });
            currentUser = data.user;
            updateCurrentUserUI();
            showView('home');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            showToast('Welcome to Connectify space!', 'success');
            loadWhoToFollow();
        } catch (err) {
            // Error is handled in apiFetch (toast is shown)
        }
    };
    
    // Signup Form Submit
    document.getElementById('signup-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const display_name = document.getElementById('signup-display-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        try {
            const data = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: { username, display_name, email, password }
            });
            currentUser = data.user;
            updateCurrentUserUI();
            showView('home');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            showToast('Your account has been created!', 'success');
            loadWhoToFollow();
        } catch (err) {
            // Error handled in apiFetch
        }
    };
    
    // Logout Click
    document.getElementById('logout-btn').onclick = async () => {
        if (!confirm('Log out from Connectify?')) return;
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
            currentUser = null;
            document.getElementById('app-screen').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
            showToast('Logged out of Connectify', 'info');
        } catch (e) {
            // Force logout view anyway
            currentUser = null;
            document.getElementById('app-screen').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
        }
    };
    
    // Navigation Sidebar Clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            const viewName = item.dataset.view;
            showView(viewName);
        };
    });
    
    // Click Sidebar Profile avatar card to show own profile
    document.getElementById('current-user-card').onclick = () => {
        showView('profile', { username: currentUser.username });
    };
    
    // Feed Category Tabs (Global vs Following)
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFeedType = tab.dataset.feed;
            loadFeedPosts();
        };
    });
    
    // Profile Filter Tabs (My Posts vs Liked Posts)
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeProfileTab = tab.dataset.profileTab;
            loadProfilePosts(viewingProfileUsername);
        };
    });
    
    // Explore searches
    let searchTimeout = null;
    const exploreSearchInput = document.getElementById('explore-search-input');
    exploreSearchInput.onkeyup = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(exploreSearchInput.value);
        }, 300);
    };
    
    // Right sidebar search (Redirects to explore page)
    const quickSearchInput = document.getElementById('quick-search-input');
    quickSearchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            const query = quickSearchInput.value.trim();
            if (query) {
                showView('explore');
                exploreSearchInput.value = query;
                handleSearch(query);
                quickSearchInput.value = '';
            }
        }
    };
    
    // Image selection handling for main feed creator
    const postImageInput = document.getElementById('post-image-input');
    const postImagePreviewContainer = document.getElementById('post-image-preview-container');
    const postImagePreview = document.getElementById('post-image-preview');
    
    postImageInput.onchange = () => {
        const file = postImageInput.files[0];
        if (file) {
            uploadPostFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                postImagePreview.src = e.target.result;
                postImagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.getElementById('remove-preview-btn').onclick = () => {
        uploadPostFile = null;
        postImageInput.value = '';
        postImagePreviewContainer.classList.add('hidden');
        postImagePreview.src = '#';
    };
    
    // Submit Post Form (Main feed creator)
    document.getElementById('create-post-form').onsubmit = async (e) => {
        e.preventDefault();
        const contentInput = document.getElementById('post-content-input');
        const content = contentInput.value.trim();
        
        if (!content && !uploadPostFile) return;
        
        const formData = new FormData();
        formData.append('content', content);
        if (uploadPostFile) {
            formData.append('image', uploadPostFile);
        }
        
        try {
            const data = await apiFetch('/api/posts/create', {
                method: 'POST',
                body: formData
            });
            
            // Clear inputs
            contentInput.value = '';
            uploadPostFile = null;
            postImageInput.value = '';
            postImagePreviewContainer.classList.add('hidden');
            
            showToast('Your post has been broadcasted!', 'success');
            
            // Reload global feed
            loadFeedPosts();
        } catch (err) {
            // Fetch error is toasted
        }
    };
    
    // --- MODALS TOGGLES ---
    
    // Quick Post Modal
    const quickPostModal = document.getElementById('quick-post-modal');
    document.getElementById('open-post-modal-btn').onclick = () => {
        quickPostModal.classList.remove('hidden');
        document.getElementById('quick-post-content-input').focus();
    };
    
    document.getElementById('close-post-modal-btn').onclick = () => {
        quickPostModal.classList.add('hidden');
    };
    
    // Quick Post Select File Previews
    const quickPostImageInput = document.getElementById('quick-post-image-input');
    const quickPostImagePreviewContainer = document.getElementById('quick-post-image-preview-container');
    const quickPostImagePreview = document.getElementById('quick-post-image-preview');
    
    quickPostImageInput.onchange = () => {
        const file = quickPostImageInput.files[0];
        if (file) {
            uploadQuickPostFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                quickPostImagePreview.src = e.target.result;
                quickPostImagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.getElementById('remove-quick-preview-btn').onclick = () => {
        uploadQuickPostFile = null;
        quickPostImageInput.value = '';
        quickPostImagePreviewContainer.classList.add('hidden');
        quickPostImagePreview.src = '#';
    };
    
    // Submit Quick Post Form
    document.getElementById('quick-post-form').onsubmit = async (e) => {
        e.preventDefault();
        const contentInput = document.getElementById('quick-post-content-input');
        const content = contentInput.value.trim();
        
        if (!content && !uploadQuickPostFile) return;
        
        const formData = new FormData();
        formData.append('content', content);
        if (uploadQuickPostFile) {
            formData.append('image', uploadQuickPostFile);
        }
        
        try {
            await apiFetch('/api/posts/create', {
                method: 'POST',
                body: formData
            });
            
            // Reset
            contentInput.value = '';
            uploadQuickPostFile = null;
            quickPostImageInput.value = '';
            quickPostImagePreviewContainer.classList.add('hidden');
            quickPostModal.classList.add('hidden');
            
            showToast('Post uploaded successfully', 'success');
            loadFeedPosts();
        } catch (err) {
            // Error toasts handled
        }
    };
    
    // Edit Profile Modal Toggles
    const editProfileModal = document.getElementById('edit-profile-modal');
    document.getElementById('edit-profile-btn').onclick = () => {
        // Pre-fill fields
        document.getElementById('edit-display-name').value = currentUser.display_name;
        document.getElementById('edit-bio').value = currentUser.bio || '';
        document.getElementById('edit-avatar-preview').src = currentUser.avatar;
        document.getElementById('edit-cover-preview').src = currentUser.cover_image;
        
        editAvatarFile = null;
        editCoverFile = null;
        
        editProfileModal.classList.remove('hidden');
    };
    
    const closeProfileModal = () => {
        editProfileModal.classList.add('hidden');
    };
    document.getElementById('close-edit-modal-btn').onclick = closeProfileModal;
    document.getElementById('cancel-edit-modal-btn').onclick = closeProfileModal;
    
    // Edit Profile Inputs Previews
    const editAvatarInput = document.getElementById('edit-avatar-input');
    editAvatarInput.onchange = () => {
        const file = editAvatarInput.files[0];
        if (file) {
            editAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('edit-avatar-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    const editCoverInput = document.getElementById('edit-cover-input');
    editCoverInput.onchange = () => {
        const file = editCoverInput.files[0];
        if (file) {
            editCoverFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('edit-cover-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Edit Profile Submit
    document.getElementById('edit-profile-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const display_name = document.getElementById('edit-display-name').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        
        const formData = new FormData();
        formData.append('display_name', display_name);
        formData.append('bio', bio);
        
        if (editAvatarFile) formData.append('avatar', editAvatarFile);
        if (editCoverFile) formData.append('cover_image', editCoverFile);
        
        try {
            const data = await apiFetch('/api/users/profile', {
                method: 'POST',
                body: formData
            });
            
            currentUser = data.user;
            updateCurrentUserUI();
            closeProfileModal();
            showToast('Connectify details updated', 'success');
            
            // Reload profile page to display changes
            loadProfileDetails(currentUser.username);
        } catch (err) {
            // Error toasts handled
        }
    };
    
    // Close modals on clicking overlay background
    window.onclick = (e) => {
        if (e.target === quickPostModal) quickPostModal.classList.add('hidden');
        if (e.target === editProfileModal) editProfileModal.classList.add('hidden');
    };
}

// Helpers
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
