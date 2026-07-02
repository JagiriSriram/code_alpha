from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db import transaction
from django.db.models import Q

from .models import Category, Product, Order, OrderItem
from .forms import UserRegisterForm, OrderCreateForm
from .cart import Cart

def product_list(request, category_slug=None):
    category = None
    categories = Category.objects.all()
    products = Product.objects.filter(stock__gt=0)
    
    # Search functionality
    query = request.GET.get('q')
    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        
    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)
        products = products.filter(category=category)
        
    # Sort functionality
    sort = request.GET.get('sort')
    if sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'newest':
        products = products.order_by('-created_at')

    context = {
        'category': category,
        'categories': categories,
        'products': products,
        'query': query,
        'sort': sort,
    }
    return render(request, 'shop/product/list.html', context)


def product_detail(request, id, slug):
    product = get_object_or_404(Product, id=id, slug=slug)
    related_products = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]
    context = {
        'product': product,
        'related_products': related_products,
    }
    return render(request, 'shop/product/detail.html', context)


# User authentication views
def register(request):
    if request.user.is_authenticated:
        return redirect('shop:product_list')
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"Account created for {user.username}! You are now logged in.")
            login(request, user)
            return redirect('shop:product_list')
    else:
        form = UserRegisterForm()
    return render(request, 'shop/auth/register.html', {'form': form})


@login_required
def profile(request):
    orders = request.user.orders.all()
    return render(request, 'shop/auth/profile.html', {'orders': orders})


# AJAX Shopping Cart View Endpoints
@require_POST
def cart_add(request, product_id):
    cart = Cart(request)
    product = get_object_or_404(Product, id=product_id)
    quantity = int(request.POST.get('quantity', 1))
    override_quantity = request.POST.get('override') == 'True'
    
    # Check inventory
    if product.stock < quantity and not override_quantity:
        return JsonResponse({
            'success': False,
            'message': f"Only {product.stock} items left in stock."
        }, status=400)

    cart.add(product=product, quantity=quantity, override_quantity=override_quantity)
    
    # Prepare response data
    item_total = 0
    item_quantity = 0
    for item in cart:
        if item['product'].id == product.id:
            item_total = item['total_price']
            item_quantity = item['quantity']
            break

    return JsonResponse({
        'success': True,
        'message': f"Added {product.name} to cart.",
        'cart_length': len(cart),
        'cart_total': float(cart.get_total_price()),
        'item': {
            'id': product.id,
            'name': product.name,
            'price': float(product.price),
            'quantity': item_quantity,
            'total_price': float(item_total),
            'image_url': product.get_image_url(),
            'stock': product.stock
        }
    })


@require_POST
def cart_remove(request, product_id):
    cart = Cart(request)
    product = get_object_or_404(Product, id=product_id)
    cart.remove(product)
    
    return JsonResponse({
        'success': True,
        'message': f"Removed {product.name} from cart.",
        'cart_length': len(cart),
        'cart_total': float(cart.get_total_price())
    })


def cart_detail_api(request):
    cart = Cart(request)
    cart_items = []
    for item in cart:
        cart_items.append({
            'id': item['product'].id,
            'name': item['product'].name,
            'price': float(item['price']),
            'quantity': item['quantity'],
            'total_price': float(item['total_price']),
            'image_url': item['product'].get_image_url(),
            'stock': item['product'].stock
        })
    return JsonResponse({
        'items': cart_items,
        'cart_length': len(cart),
        'cart_total': float(cart.get_total_price())
    })


# Checkout and Order View Processing
@login_required
def order_create(request):
    cart = Cart(request)
    if len(cart) == 0:
        messages.error(request, "Your cart is empty.")
        return redirect('shop:product_list')
        
    if request.method == 'POST':
        form = OrderCreateForm(request.POST)
        if form.is_valid():
            try:
                # Wrap inside database transaction to ensure safety
                with transaction.atomic():
                    order = form.save(commit=False)
                    order.user = request.user
                    order.total_price = cart.get_total_price()
                    order.save()
                    
                    for item in cart:
                        product = item['product']
                        # Ensure stock is updated and re-verified
                        if product.stock < item['quantity']:
                            raise ValueError(f"Insufficient stock for {product.name}. Only {product.stock} available.")
                        
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            price=item['price'],
                            quantity=item['quantity']
                        )
                        # Deduct from stock
                        product.stock -= item['quantity']
                        product.save()
                        
                    # Clear cart after order is confirmed
                    cart.clear()
                    
                    messages.success(request, "Order processed successfully!")
                    return redirect('shop:order_success', order_id=order.id)
            except ValueError as e:
                messages.error(request, str(e))
            except Exception as e:
                messages.error(request, "An error occurred while processing your order. Please try again.")
    else:
        # Prepopulate form with user info if available
        initial_data = {
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
        }
        form = OrderCreateForm(initial=initial_data)
        
    return render(request, 'shop/order/create.html', {'cart': cart, 'form': form})


@login_required
def order_success(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'shop/order/success.html', {'order': order})
