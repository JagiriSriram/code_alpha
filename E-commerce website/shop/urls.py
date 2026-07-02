from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'shop'

urlpatterns = [
    # Catalog URLs
    path('', views.product_list, name='product_list'),
    path('category/<slug:category_slug>/', views.product_list, name='product_list_by_category'),
    path('product/<int:id>/<slug:slug>/', views.product_detail, name='product_detail'),
    
    # Auth URLs
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('login/', auth_views.LoginView.as_view(template_name='shop/auth/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='shop:product_list'), name='logout'),
    
    # Cart API URLs
    path('cart/api/get/', views.cart_detail_api, name='cart_detail_api'),
    path('cart/api/add/<int:product_id>/', views.cart_add, name='cart_add'),
    path('cart/api/remove/<int:product_id>/', views.cart_remove, name='cart_remove'),
    
    # Order URLs
    path('order/checkout/', views.order_create, name='order_create'),
    path('order/success/<int:order_id>/', views.order_success, name='order_success'),
]
