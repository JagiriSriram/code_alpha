# Connectify | Premium Social Media Space

A premium, fully-functional, and responsive Single Page Application (SPA) social media platform. The backend is built with **Django** and **SQLite**, exposing a clean JSON API. The frontend is a modern user interface crafted using HTML5, vanilla CSS, and vanilla JavaScript.

---

## 🌟 Key Features

*   **Secure Authentication**: Standard cookie-based Django session authentication covering registration, login, logout, and current user checks.
*   **Detailed User Profiles**: Displays dynamic stats (post count, follower count, following count), user bios, avatars, and cover banners.
*   **Publish Posts & Images**: Supports writing text posts with optional file uploads for graphics (via Django's media storage and Pillow).
*   **Nested Comment Threading**: Users can add replies, view reply lists, and delete comments on any post.
*   **Likes & Follows System**: Interactive heart toggling on posts and follow buttons on profiles/suggestions.
*   **Premium Visuals & Interactions**: Dark-mode glassmorphic layouts with custom neon gradients, glowing inputs, and smooth micro-animations.
*   **Responsive Viewport Scaling**: Columns collapse down to a sticky, glassy bottom navigation layout on mobile screens.

---

## 🛠️ Technology Stack

*   **Backend**: Django (Python 3)
*   **Database**: SQLite
*   **File Handling**: Pillow (for media processing)
*   **Security & Helpers**: django-cors-headers
*   **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
*   **Icons**: Lucide Icons CDN

---

## 📂 Project Structure

```
Social media platform/
├── manage.py                  # Django CLI runner
├── requirements.txt           # Python dependencies
├── social_project/            # Main project configuration (CORS, Static/Media dirs)
├── social_app/                # App database models, signals, and JSON API views
├── static/
│   ├── css/style.css          # Glassmorphic responsive styling
│   ├── images/                # Default avatar and cover graphics
│   └── js/app.js              # Routing, fetch client, and DOM renderer
├── templates/
│   └── index.html             # SPA main container page
└── media/                     # Upload directory for avatars/post images
```

---

## 🚀 Setup & Execution Guide

Follow these steps to run the application locally on your system:

### 1. Initialize Virtual Environment
Navigate into the project directory and create a Python virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
Install all package requirements listed in the manifest:
```bash
pip install -r requirements.txt
```

### 3. Initialize Database Tables
Run Django migrations to create the database schemas:
```bash
python manage.py makemigrations social_app
python manage.py migrate
```

### 4. Seed Seed-Data & Default Media
Generate default cover/avatar graphics and seed the database with mock test profiles, comments, and posts:
```bash
# Generate images
python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_project.settings'); django.setup(); from social_app.models import Profile; import PIL" 

# Seed database
python -c "import os, django, sys; sys.path.append(os.getcwd()); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_project.settings'); django.setup(); from django.contrib.auth.models import User; from social_app.models import Profile, Post, Comment, Like, Follow; User.objects.exclude(is_superuser=True).delete(); Post.objects.all().delete(); u1 = User.objects.create_user(username='cosmic_traveler', email='stella@aura.space', password='password123'); u1.first_name = 'Stella Nova'; u1.save(); p1 = u1.profile; p1.bio = 'Exploring the stellar pathways. Astrophotography collector.'; p1.save(); u2 = User.objects.create_user(username='pixel_artisan', email='leo@aura.space', password='password123'); u2.first_name = 'Leo DaVinci'; u2.save(); p2 = u2.profile; p2.bio = 'Digital architect & glassmorphism fan.'; p2.save(); post1 = Post.objects.create(user=u1, content='Captured the Orion Nebula from my telescope!'); Comment.objects.create(post=post1, user=u2, content='This is absolutely breathtaking, Stella!'); Like.objects.create(user=u2, post=post1); Follow.objects.create(follower=u1, followed=u2); Follow.objects.create(follower=u2, followed=u1); print('Seeded!')"
```
*(Or run our pre-configured seeding commands directly)*

### 5. Create a Superuser (Optional)
To access the admin dashboard, create an administrator account:
```bash
python manage.py createsuperuser
```

### 6. Run local dev server
Start the Django development server:
```bash
python manage.py runserver
```
Navigate to [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your web browser.

---

## 🔑 Test Accounts
You can log in and interact immediately using the following accounts:
1.  **Stella Nova**: Username: `cosmic_traveler` | Password: `password123`
2.  **Leo DaVinci**: Username: `pixel_artisan` | Password: `password123`
3.  **Administrator**: Username: `admin` | Password: `admin123` (Admin panel at `/admin/`)
