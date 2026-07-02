# smartKart - Premium E-Commerce Store

smartKart is a modern, responsive, and fully-functional E-Commerce application built using Python's **Django** framework on the backend, styled with **Vanilla CSS**, and powered by **Vanilla JavaScript** on the frontend for smooth, asynchronous user experiences.

This project was built for an internship submission, satisfying requirements for database persistence (users, products, orders), user authentication, interactive cart management, search and catalog sorting, and inventory management.

---

## 🌟 Key Features

1. **Product Catalog**: Dynamic grids showing products under various categories, complete with search filtering and price/date-based sorting.
2. **Product Detail Page**: Displays high-resolution visuals, item description, real-time stock indicators, and related product recommendations.
3. **Interactive AJAX Cart Drawer**: A slide-in cart drawer allowing users to add items, modify quantities, and remove items instantly without page reloads.
4. **Checkout and Order Processing**: A two-column checkout page where users can input shipping details. Order placements are run inside safe database transactions.
5. **Inventory Checking**: Real-time stock counts. When an order is placed, stock quantities are decremented. Items cannot be added to the cart beyond their available stock limits.
6. **User Authentication & Dashboard**: Users can register accounts, securely log in, and view their dashboard profile showing personal details and interactive expandable order histories.
7. **Built-in Administrative Console**: Features custom layouts inside Django Admin to add/edit products, manage categories, and update order statuses (Pending, Processing, Shipped, Delivered).

---

## 🛠️ Technology Stack

- **Backend**: Python + Django 6.0
- **Database**: SQLite (Self-contained, local storage file)
- **Frontend**: HTML5, CSS3 (Vanilla Custom Theme: Indigo & Teal Accent), JavaScript (Vanilla ES6, AJAX Fetch API)
- **Icons & Fonts**: FontAwesome v6, Google Fonts (Inter & Outfit)

---

## 📁 Repository Directory Structure

```
Code_alpha/
│
├── core/                   # Django main configuration folder
│   ├── settings.py         # Global settings (apps, media, templates)
│   ├── urls.py             # Main router
│   └── wsgi.py / asgi.py   # Gateway interfaces
│
├── shop/                   # Core shop app folder
│   ├── management/         # Seeding commands
│   │   └── commands/
│   │       └── populate_db.py
│   ├── cart.py             # Session cart helper
│   ├── context_processors.py
│   ├── forms.py            # User registration & order checkout forms
│   ├── models.py           # Product, Category, Order & OrderItem schemas
│   ├── admin.py            # Custom Admin panels layout
│   ├── urls.py             # App routing URLs
│   └── views.py            # Controllers and AJAX endpoints
│
├── static/                 # Global asset directories
│   ├── css/
│   │   └── style.css       # Core stylesheet (glassmorphism variables, flex grids)
│   └── js/
│       └── main.js         # Client-side AJAX cart drawer controllers
│
├── templates/              # HTML Templates (extending base.html)
│   ├── base.html           # Nav bar, toast system, sliding drawer structure
│   └── shop/
│       ├── auth/           # Login, Register, Profile templates
│       ├── order/          # Checkout, Success templates
│       └── product/        # Product list, Details templates
│
├── requirements.txt        # Project package dependencies
├── .gitignore              # Files to ignore (venv, db, media uploads)
├── manage.py               # Django runner command line utility
└── README.md               # Project documentation
```

---

## 🚀 Setup & Installation Instructions

Follow these step-by-step instructions to get the application running locally:

### Prerequisites
Make sure you have **Python 3.10+** and **pip** installed.

### 1. Clone the Repository
Clone the project files to your local system:
```bash
git clone <repository-url>
cd Code_alpha
```

### 2. Set Up a Virtual Environment
Create a Python virtual environment to isolate the dependencies:
```bash
# On Windows
python -m venv .venv
.venv\Scripts\activate

# On macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
Install all required modules from the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### 4. Create and Migrate Database Schemas
Initialize the SQLite database and create schemas for Django authentication and shop models:
```bash
python manage.py makemigrations shop
python manage.py migrate
```

### 5. Seed the Database (Load Sample Products)
Run the custom seeder command to automatically populate categories and products (complete with descriptions and Unsplash image URLs):
```bash
python manage.py populate_db
```

### 6. Create an Administrative Superuser
To access the Django Admin panel, create a superuser account:
```bash
python manage.py createsuperuser
```
*(Enter your chosen username, email, and password. Write it down for login!)*

### 7. Run the Development Server
Launch the local web server:
```bash
python manage.py runserver
```

You can now open your browser and navigate to:
- **Store Front**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Admin Dashboard**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 🔒 Evaluation Testing Guide

To test the application flows easily, follow this walkthrough:

1. **Verify Home Listing**: Check search query fields and click category tabs (Electronics, Apparel, Decor) to see lists filter. Select sort parameters to change listing sequences.
2. **Add to Cart Drawer**: Click "Add" on any listing. The cart drawer will slide open from the right showing the added item. Use `+` and `-` inside the drawer to alter quantities or click "Remove" to delete it.
3. **Register / Login**: Click "Register" in the top bar to create a user account.
4. **Interactive Checkout**: Go to the cart drawer, click "Proceed to Checkout", complete shipping fields, and click "Place Order".
5. **Success Page**: Verify order receipt references and redirect buttons.
6. **User Profile**: Check details card and expand orders history in the list to verify items.
7. **Admin controls**: Navigate to `/admin/` and log in to update order statuses or insert new inventory listings.
