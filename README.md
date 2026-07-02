# CodeAlpha Internship - Projects Portfolio

This repository contains the projects completed during the software engineering and web development internship at **CodeAlpha**. Each project is self-contained within its own dedicated directory.

---

## 📂 Projects Directory

| S.no | Project Name | Directory | Tech Stack | Brief Description |
|---|--------------|-----------|------------|-------------------|
| 1 | **smartKart (E-Commerce)** | [`E-commerce website/`](./E-commerce%20website/) | Python, Django, SQLite, Vanilla CSS, Vanilla JS | A fully-functional premium e-commerce site with product listings, dynamic details cards, interactive AJAX cart drawer, customer profiles, order histories, and inventory stock tracking. |

---

## 🛠️ Individual Project Setup & Execution Guides

To run any project, navigate into its respective folder and follow the execution instructions. Below is the setup guide for the first project.

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
