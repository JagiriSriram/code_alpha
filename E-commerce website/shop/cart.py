from decimal import Decimal
from django.conf import settings
from .models import Product

class Cart:
    def __init__(self, request):
        self.session = request.session
        # Use a setting or default to 'cart'
        self.cart_id = getattr(settings, 'CART_SESSION_ID', 'cart')
        cart = self.session.get(self.cart_id)
        if not cart:
            cart = self.session[self.cart_id] = {}
        self.cart = cart

    def add(self, product, quantity=1, override_quantity=False):
        product_id = str(product.id)
        if product_id not in self.cart:
            self.cart[product_id] = {
                'quantity': 0,
                'price': str(product.price)
            }
        
        if override_quantity:
            self.cart[product_id]['quantity'] = quantity
        else:
            self.cart[product_id]['quantity'] += quantity
            
        # Ensure quantity does not exceed product stock if checked
        if self.cart[product_id]['quantity'] > product.stock:
            self.cart[product_id]['quantity'] = product.stock

        self.save()

    def save(self):
        self.session.modified = True

    def remove(self, product):
        product_id = str(product.id)
        if product_id in self.cart:
            del self.cart[product_id]
            self.save()

    def __iter__(self):
        product_ids = self.cart.keys()
        products = {str(p.id): p for p in Product.objects.filter(id__in=product_ids)}
        
        for product_id, item in self.cart.items():
            product = products.get(product_id)
            if product:
                yield {
                    'product': product,
                    'price': Decimal(item['price']),
                    'quantity': item['quantity'],
                    'total_price': Decimal(item['price']) * item['quantity']
                }

    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())

    def get_total_price(self):
        return sum(Decimal(item['price']) * item['quantity'] for item in self.cart.values() if 'price' in item)

    def clear(self):
        if self.cart_id in self.session:
            del self.session[self.cart_id]
            self.save()
