from django.core.management.base import BaseCommand
from django.utils.text import slugify
from shop.models import Category, Product

class Command(BaseCommand):
    help = 'Seeds the database with sample categories and products for testing.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Checking and seeding database collections...")

        # 1. Seed Categories
        categories_data = [
            {'name': 'Electronics', 'slug': 'electronics'},
            {'name': 'Apparel', 'slug': 'apparel'},
            {'name': 'Home Decor', 'slug': 'home-decor'},
        ]

        categories = {}
        for cat_info in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_info['slug'],
                defaults={'name': cat_info['name']}
            )
            categories[cat_info['slug']] = category
            if created:
                self.stdout.write(f"Created category: {category.name}")

        # 2. Seed Products
        products_data = [
            # Electronics
            {
                'category': categories['electronics'],
                'name': 'Smart Sound Headphones',
                'slug': 'smart-sound-headphones',
                'description': 'Experience studio-quality sound with adaptive hybrid noise cancellation. Up to 40 hours of playtime and ultimate memory foam comfort.',
                'price': 16999.00,
                'stock': 25,
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['electronics'],
                'name': 'Titan Smartwatch V2',
                'slug': 'titan-smartwatch-v2',
                'description': 'Track your metrics in real-time with an elegant sapphire glass display, built-in GPS, blood oxygen sensor, and 7-day battery life.',
                'price': 20999.00,
                'stock': 15,
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['electronics'],
                'name': 'NeoPhone 15 Pro',
                'slug': 'neophone-15-pro',
                'description': 'The absolute peak of mobile performance. A titanium design, triple lens dynamic camera system, and the powerful A18 processor.',
                'price': 114999.00,
                'stock': 8,
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['electronics'],
                'name': 'Quantum Earbuds Pro',
                'slug': 'quantum-earbuds-pro',
                'description': 'Active noise cancelling wireless earbuds with smart touch control, ultra-low latency gaming mode, and IPX7 water resistance.',
                'price': 4999.00,
                'stock': 35,
                'image_url': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop'
            },
            # Apparel
            {
                'category': categories['apparel'],
                'name': 'Urban Comfort Hoodie',
                'slug': 'urban-comfort-hoodie',
                'description': 'Crafted with 100% organic heavy-weight cotton. Relaxed fit with modern drop shoulders and double-lined hood for premium warmth.',
                'price': 3499.00,
                'stock': 50,
                'image_url': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['apparel'],
                'name': 'Classic Leather Sneaker',
                'slug': 'classic-leather-sneaker',
                'description': 'Minimalist everyday sneakers. Genuine calfskin leather exterior with soft cork insoles that adapt to your posture over time.',
                'price': 5999.00,
                'stock': 20,
                'image_url': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['apparel'],
                'name': 'Vanguard Canvas Pack',
                'slug': 'vanguard-canvas-pack',
                'description': 'Water-resistant waxed canvas backpack with Italian leather trim. Dedicated 16-inch laptop pocket and hidden luggage strap.',
                'price': 7499.00,
                'stock': 12,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['apparel'],
                'name': 'Elite Running Shoes',
                'slug': 'elite-running-shoes',
                'description': 'High performance running shoes with breathable knit mesh, carbon fiber plate, and reactive foam sole for marathon speed.',
                'price': 8999.00,
                'stock': 18,
                'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'
            },
            # Home Decor
            {
                'category': categories['home-decor'],
                'name': 'Minimalist Desk Lamp',
                'slug': 'minimalist-desk-lamp',
                'description': 'Sleek brushed brass study lamp with custom rotatable head. Built-in step-less dimming and soft eye-care warm LEDs.',
                'price': 2499.00,
                'stock': 30,
                'image_url': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['home-decor'],
                'name': 'Zen Ceramic Planter',
                'slug': 'zen-ceramic-planter',
                'description': 'Handmade clay planter with custom geometric texturing. Features drainage plug and solid bamboo water catch stand.',
                'price': 999.00,
                'stock': 40,
                'image_url': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['home-decor'],
                'name': 'Velvet Lounge Cushion',
                'slug': 'velvet-lounge-cushion',
                'description': 'Super soft premium cotton-velvet pillow cushion. Fits perfectly on sofas, chairs, or beds. Includes hypoallergenic polyfill filler.',
                'price': 1499.00,
                'stock': 25,
                'image_url': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600&auto=format&fit=crop'
            },
            {
                'category': categories['home-decor'],
                'name': 'Aromatic Soy Candle',
                'slug': 'aromatic-soy-candle',
                'description': 'Hand-poured lavender and sandalwood scented candle made with 100% natural soy wax. Up to 45 hours burn time.',
                'price': 899.00,
                'stock': 50,
                'image_url': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop'
            }
        ]

        for prod_info in products_data:
            product, created = Product.objects.get_or_create(
                slug=prod_info['slug'],
                defaults={
                    'category': prod_info['category'],
                    'name': prod_info['name'],
                    'description': prod_info['description'],
                    'price': prod_info['price'],
                    'stock': prod_info['stock'],
                    'image_url': prod_info['image_url'],
                }
            )
            if created:
                self.stdout.write(f"Created product: {product.name}")
            else:
                # Update stock and price anyway to reset for testing
                product.price = prod_info['price']
                product.stock = prod_info['stock']
                product.image_url = prod_info['image_url']
                product.save()
                self.stdout.write(f"Updated product details: {product.name}")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
