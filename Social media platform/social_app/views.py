import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from .models import Profile, Post, Comment, Like, Follow

# Helper to serialize user profile info
def serialize_user_profile(user, current_user=None):
    profile = user.profile
    followers_count = Follow.objects.filter(followed=user).count()
    following_count = Follow.objects.filter(follower=user).count()
    posts_count = Post.objects.filter(user=user).count()
    
    avatar_url = profile.avatar.url if profile.avatar else '/media/avatars/default.png'
    cover_url = profile.cover_image.url if profile.cover_image else '/media/covers/default.png'
    
    is_following = False
    if current_user and current_user.is_authenticated and current_user != user:
        is_following = Follow.objects.filter(follower=current_user, followed=user).exists()
        
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'display_name': user.first_name or user.username,
        'bio': profile.bio,
        'avatar': avatar_url,
        'cover_image': cover_url,
        'posts_count': posts_count,
        'followers_count': followers_count,
        'following_count': following_count,
        'is_following': is_following,
        'is_self': current_user == user if current_user else False,
        'date_joined': user.date_joined.strftime('%Y-%m-%d')
    }

# Helper to serialize a post
def serialize_post(post, current_user=None):
    likes_count = Like.objects.filter(post=post).count()
    comments_count = Comment.objects.filter(post=post).count()
    
    is_liked = False
    if current_user and current_user.is_authenticated:
        is_liked = Like.objects.filter(user=current_user, post=post).exists()
        
    avatar_url = post.user.profile.avatar.url if post.user.profile.avatar else '/media/avatars/default.png'
    
    return {
        'id': post.id,
        'content': post.content,
        'image': post.image.url if post.image else None,
        'created_at': post.created_at.strftime('%Y-%m-%dT%H:%M:%S'),
        'likes_count': likes_count,
        'comments_count': comments_count,
        'is_liked': is_liked,
        'author': {
            'id': post.user.id,
            'username': post.user.username,
            'display_name': post.user.first_name or post.user.username,
            'avatar': avatar_url
        }
    }

# Helper to serialize a comment
def serialize_comment(comment):
    avatar_url = comment.user.profile.avatar.url if comment.user.profile.avatar else '/media/avatars/default.png'
    return {
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at.strftime('%Y-%m-%dT%H:%M:%S'),
        'author': {
            'id': comment.user.id,
            'username': comment.user.username,
            'display_name': comment.user.first_name or comment.user.username,
            'avatar': avatar_url
        }
    }

# --- AUTH VIEWS ---

@csrf_exempt
def register_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('display_name', '')
        
        if not username or not email or not password:
            return JsonResponse({'error': 'Username, email and password are required'}, status=400)
            
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
            
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already registered'}, status=400)
            
        user = User.objects.create_user(username=username, email=email, password=password)
        user.first_name = display_name
        user.save()
        
        # Log the user in to establish a session
        login(request, user)
        
        return JsonResponse({
            'message': 'Registration successful',
            'user': serialize_user_profile(user, user)
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Username and password are required'}, status=400)
            
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'message': 'Login successful',
                'user': serialize_user_profile(user, user)
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def logout_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})

def get_current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': serialize_user_profile(request.user, request.user)
        })
    else:
        return JsonResponse({'authenticated': False})

# --- USER PROFILE VIEWS ---

def get_profile(request, username):
    user = get_object_or_404(User, username=username)
    return JsonResponse(serialize_user_profile(user, request.user))

@csrf_exempt
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required (multipart/form-data)'}, status=405)
        
    try:
        user = request.user
        profile = user.profile
        
        display_name = request.POST.get('display_name')
        bio = request.POST.get('bio')
        
        if display_name is not None:
            user.first_name = display_name
            user.save()
            
        if bio is not None:
            profile.bio = bio
            
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
            
        if 'cover_image' in request.FILES:
            profile.cover_image = request.FILES['cover_image']
            
        profile.save()
        
        return JsonResponse({
            'message': 'Profile updated successfully',
            'user': serialize_user_profile(user, user)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_follow_suggestions(request):
    if not request.user.is_authenticated:
        return JsonResponse({'users': []})
        
    # Get users that the current user is NOT following already, and is not themselves
    following_ids = Follow.objects.filter(follower=request.user).values_list('followed_id', flat=True)
    
    suggestions = User.objects.exclude(
        id__in=list(following_ids) + [request.user.id]
    ).annotate(
        follower_count=Count('followers')
    ).order_by('-follower_count')[:5]
    
    serialized = [serialize_user_profile(u, request.user) for u in suggestions]
    return JsonResponse({'users': serialized})

# --- POSTS VIEWS ---

def feed_posts(request):
    feed_type = request.GET.get('feed', 'global')
    username = request.GET.get('username')
    
    posts = Post.objects.all().select_related('user', 'user__profile')
    
    if username:
        user = get_object_or_404(User, username=username)
        posts = posts.filter(user=user)
    elif feed_type == 'followed':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required for followed feed'}, status=401)
        following_ids = Follow.objects.filter(follower=request.user).values_list('followed_id', flat=True)
        posts = posts.filter(Q(user_id__in=following_ids) | Q(user=request.user))
    elif feed_type == 'liked':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required for liked feed'}, status=401)
        liked_post_ids = Like.objects.filter(user=request.user).values_list('post_id', flat=True)
        posts = posts.filter(id__in=liked_post_ids)
        
    # Return newest first
    posts = posts.order_by('-created_at')
    
    serialized = [serialize_post(post, request.user) for post in posts]
    return JsonResponse({'posts': serialized})

@csrf_exempt
def create_post(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    content = request.POST.get('content', '').strip()
    image = request.FILES.get('image')
    
    if not content and not image:
        return JsonResponse({'error': 'Post must contain content or an image'}, status=400)
        
    try:
        post = Post.objects.create(
            user=request.user,
            content=content,
            image=image
        )
        return JsonResponse({
            'message': 'Post created successfully',
            'post': serialize_post(post, request.user)
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def delete_post(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'DELETE' and request.method != 'POST': # Support POST/DELETE
        return JsonResponse({'error': 'DELETE or POST method required'}, status=405)
        
    post = get_object_or_404(Post, id=post_id)
    if post.user != request.user:
        return JsonResponse({'error': 'You do not have permission to delete this post'}, status=403)
        
    try:
        post.delete()
        return JsonResponse({'message': 'Post deleted successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# --- LIKES VIEWS ---

@csrf_exempt
def toggle_like(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    post = get_object_or_404(Post, id=post_id)
    like_qs = Like.objects.filter(user=request.user, post=post)
    
    if like_qs.exists():
        like_qs.delete()
        liked = False
    else:
        Like.objects.create(user=request.user, post=post)
        liked = True
        
    likes_count = Like.objects.filter(post=post).count()
    return JsonResponse({
        'liked': liked,
        'likes_count': likes_count
    })

# --- COMMENTS VIEWS ---

def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = Comment.objects.filter(post=post).select_related('user', 'user__profile')
    serialized = [serialize_comment(c) for c in comments]
    return JsonResponse({'comments': serialized})

@csrf_exempt
def add_comment(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    try:
        post = get_object_or_404(Post, id=post_id)
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        
        if not content:
            return JsonResponse({'error': 'Comment content cannot be empty'}, status=400)
            
        comment = Comment.objects.create(
            post=post,
            user=request.user,
            content=content
        )
        
        return JsonResponse({
            'message': 'Comment added successfully',
            'comment': serialize_comment(comment)
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def delete_comment(request, comment_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'DELETE' and request.method != 'POST':
        return JsonResponse({'error': 'DELETE or POST method required'}, status=405)
        
    comment = get_object_or_404(Comment, id=comment_id)
    if comment.user != request.user and comment.post.user != request.user:
        return JsonResponse({'error': 'You do not have permission to delete this comment'}, status=403)
        
    try:
        comment.delete()
        return JsonResponse({'message': 'Comment deleted successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# --- FOLLOW VIEWS ---

@csrf_exempt
def toggle_follow(request, user_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    target_user = get_object_or_404(User, id=user_id)
    if target_user == request.user:
        return JsonResponse({'error': 'You cannot follow yourself'}, status=400)
        
    follow_qs = Follow.objects.filter(follower=request.user, followed=target_user)
    
    if follow_qs.exists():
        follow_qs.delete()
        following = False
    else:
        Follow.objects.create(follower=request.user, followed=target_user)
        following = True
        
    followers_count = Follow.objects.filter(followed=target_user).count()
    following_count = Follow.objects.filter(follower=request.user).count()
    
    return JsonResponse({
        'following': following,
        'followers_count': followers_count,
        'following_count': following_count
    })

def search_users(request):
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'users': []})
    users = User.objects.filter(
        Q(username__icontains=query) | Q(first_name__icontains=query)
    )
    if request.user.is_authenticated:
        users = users.exclude(id=request.user.id)
    users = users[:15]
    serialized = [serialize_user_profile(u, request.user) for u in users]
    return JsonResponse({'users': serialized})
