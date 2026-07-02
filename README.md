# CodeAlpha Internship - Projects Portfolio

This repository contains the projects completed during the software engineering and web development internship at **CodeAlpha**. Each project is self-contained within its own dedicated directory.

---

## 📂 Projects Directory

| S.no | Project Name | Directory | Tech Stack | Brief Description |
|---|--------------|-----------|------------|-------------------|
| 1 | **smartKart (E-Commerce)** | [`E-commerce website/`](./E-commerce%20website/) | Python, Django, SQLite, Vanilla CSS, Vanilla JS | A fully-functional premium e-commerce site with product listings, dynamic details cards, interactive AJAX cart drawer, customer profiles, order histories, and inventory stock tracking. |
| 2 | **Connectify (Social Media)** | [`Social media platform/`](./Social%20media%20platform/) | Python, Django, SQLite, Vanilla CSS, Vanilla JS | A premium Single Page Application (SPA) social media site featuring user profiles, text & image posts, comments, interactive like/follow mechanics, and a glassmorphism theme. |

---

## 🛠️ Individual Project Setup & Execution Guides

To run any project, navigate into its respective folder and follow the execution instructions.

### 🛒 Project 1: smartKart (E-Commerce Website)

The `E-commerce website/` directory contains a premium e-commerce storefront with order checkout systems, inventory controls, and user accounts.

#### Setup Instructions:
1. **Navigate into the project directory**:
   ```bash
   cd "E-commerce website"
   ```

2. **Initialize a virtual environment**:
   ```bash
   # On Windows
   python -m venv .venv
   .venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the local database**:
   ```bash
   python manage.py makemigrations shop
   python manage.py migrate
   ```

5. **Seed sample products and categories**:
   ```bash
   python manage.py populate_db
   ```

6. **Create an administrator account**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the local development server**:
   ```bash
   python manage.py runserver
   ```
   Open your browser and navigate to `http://127.0.0.1:8000/`. You can manage product entries and customer orders inside the admin panel at `http://127.0.0.1:8000/admin/`.

---

### 💬 Project 2: Connectify (Social Media Platform)

The `Social media platform/` directory contains a responsive micro social media site with user profiles, posts, replies, and follow recommendations.

#### Setup Instructions:
1. **Navigate into the project directory**:
   ```bash
   cd "Social media platform"
   ```

2. **Initialize a virtual environment**:
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the local database**:
   ```bash
   python manage.py makemigrations social_app
   python manage.py migrate
   ```

5. **Seed default graphics and mockup data**:
   To generate standard user assets and seed profiles/likes/follows:
   ```bash
   # Generate images
   python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_project.settings'); django.setup(); from social_app.models import Profile; import PIL" 

   # Seed DB mock records
   python -c "import os, django, sys; sys.path.append(os.getcwd()); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_project.settings'); django.setup(); from django.contrib.auth.models import User; from social_app.models import Profile, Post, Comment, Like, Follow; User.objects.exclude(is_superuser=True).delete(); Post.objects.all().delete(); u1 = User.objects.create_user(username='cosmic_traveler', email='stella@aura.space', password='password123'); u1.first_name = 'Stella Nova'; u1.save(); p1 = u1.profile; p1.bio = 'Exploring the stellar pathways. Astrophotography collector.'; p1.save(); u2 = User.objects.create_user(username='pixel_artisan', email='leo@aura.space', password='password123'); u2.first_name = 'Leo DaVinci'; u2.save(); p2 = u2.profile; p2.bio = 'Digital architect & glassmorphism fan.'; p2.save(); post1 = Post.objects.create(user=u1, content='Captured the Orion Nebula from my telescope!'); Comment.objects.create(post=post1, user=u2, content='This is absolutely breathtaking, Stella!'); Like.objects.create(user=u2, post=post1); Follow.objects.create(follower=u1, followed=u2); Follow.objects.create(follower=u2, followed=u1); print('Seeded!')"
   ```

6. **Create an administrator account**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the local development server**:
   ```bash
   python manage.py runserver
   ```
   Open your browser and navigate to `http://127.0.0.1:8000/`. Manage database records inside the admin dashboard at `http://127.0.0.1:8000/admin/` using your superuser login.

