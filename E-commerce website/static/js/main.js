// smartKart Global JavaScript - Interactive Shopping Cart Drawer & AJAX Actions

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const cartToggle = document.getElementById('cartToggle');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartDrawerClose = document.getElementById('cartDrawerClose');
    const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartDrawerCount = document.getElementById('cartDrawerCount');
    const cartBadgeCount = document.getElementById('cartBadgeCount');
    const cartDrawerSubtotal = document.getElementById('cartDrawerSubtotal');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const cartDrawerFooter = document.getElementById('cartDrawerFooter');
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    // Drawer Toggles
    if (cartToggle && cartDrawer && cartDrawerClose && cartDrawerOverlay) {
        cartToggle.addEventListener('click', () => {
            openCartDrawer();
        });

        cartDrawerClose.addEventListener('click', () => {
            closeCartDrawer();
        });

        cartDrawerOverlay.addEventListener('click', () => {
            closeCartDrawer();
        });
    }

    function openCartDrawer() {
        cartDrawer.classList.add('active');
        cartDrawerOverlay.classList.add('active');
        loadCart();
    }

    function closeCartDrawer() {
        cartDrawer.classList.remove('active');
        cartDrawerOverlay.classList.remove('active');
    }

    // Helper: Create Floating Toast Container if not exists
    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // Helper: Show Dynamic Toast Alert
    window.showToast = function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fa-solid ${iconClass} toast-icon"></i>
                <span class="toast-text">${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Click to close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto close after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    };

    // Helper: Fetch CSRF Token
    function getCsrfToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return tokenInput ? tokenInput.value : '';
    }

    // Fetch and Render Cart Drawer Contents
    function loadCart() {
        // Show loader if cart list is empty
        cartItemsList.innerHTML = `
            <div class="cart-loader" style="text-align:center; padding: 2rem;">
                <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
            </div>
        `;

        fetch('/cart/api/get/')
            .then(res => res.json())
            .then(data => {
                renderCart(data);
            })
            .catch(err => {
                console.error("Failed to load cart items:", err);
                cartItemsList.innerHTML = `<p class="error-msg" style="text-align:center; padding:1rem;">Failed to load cart. Please try again.</p>`;
            });
    }

    // Render Cart DOM Elements
    function renderCart(data) {
        // Update badge and header counters
        if (cartBadgeCount) cartBadgeCount.textContent = data.cart_length;
        if (cartDrawerCount) cartDrawerCount.textContent = data.cart_length;
        if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = `₹${data.cart_total.toFixed(2)}`;

        // Handle empty/populated states
        if (data.cart_length === 0) {
            cartEmptyState.style.display = 'flex';
            cartItemsList.innerHTML = '';
            cartDrawerFooter.style.display = 'none';
            return;
        }

        cartEmptyState.style.display = 'none';
        cartDrawerFooter.style.display = 'block';
        cartItemsList.innerHTML = '';

        data.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-img">
                    <img src="${item.image_url}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name"><a href="/product/${item.id}/${slugify(item.name)}/">${item.name}</a></h4>
                    <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <div class="cart-item-qty">
                            <button type="button" class="qty-adjust-btn minus" data-product-id="${item.id}" data-current-qty="${item.quantity}">
                                <i class="fa-solid fa-minus" style="font-size:0.75rem;"></i>
                            </button>
                            <span>${item.quantity}</span>
                            <button type="button" class="qty-adjust-btn plus" data-product-id="${item.id}" data-current-qty="${item.quantity}" data-max-stock="${item.stock}">
                                <i class="fa-solid fa-plus" style="font-size:0.75rem;"></i>
                            </button>
                        </div>
                        <button type="button" class="cart-item-remove-btn" data-product-id="${item.id}">
                            <i class="fa-regular fa-trash-can"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            cartItemsList.appendChild(itemElement);
        });

        // Attach listeners to items controls
        attachCartControlsListeners();
    }

    function attachCartControlsListeners() {
        // Quantity Adjust Buttons
        const minusBtns = cartItemsList.querySelectorAll('.qty-adjust-btn.minus');
        const plusBtns = cartItemsList.querySelectorAll('.qty-adjust-btn.plus');
        const removeBtns = cartItemsList.querySelectorAll('.cart-item-remove-btn');

        minusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                const currentQty = parseInt(btn.dataset.currentQty);
                if (currentQty > 1) {
                    updateCartItemQuantity(productId, currentQty - 1);
                } else {
                    removeCartItem(productId);
                }
            });
        });

        plusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                const currentQty = parseInt(btn.dataset.currentQty);
                const maxStock = parseInt(btn.dataset.maxStock);
                
                if (currentQty < maxStock) {
                    updateCartItemQuantity(productId, currentQty + 1);
                } else {
                    window.showToast(`Only ${maxStock} items available in stock.`, 'error');
                }
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                removeCartItem(productId);
            });
        });
    }

    // AJAX Action: Add Item to Cart
    window.addToCart = function(productId, quantity = 1) {
        const formData = new FormData();
        formData.append('quantity', quantity);
        formData.append('override', 'False');
        formData.append('csrfmiddlewaretoken', getCsrfToken());

        fetch(`/cart/api/add/${productId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errData => {
                    throw new Error(errData.message || "Failed to add product to cart.");
                });
            }
            return res.json();
        })
        .then(data => {
            window.showToast(data.message, 'success');
            // Refresh cart badge count
            if (cartBadgeCount) cartBadgeCount.textContent = data.cart_length;
            // Open the drawer to give instant visual feedback
            openCartDrawer();
        })
        .catch(err => {
            console.error(err);
            window.showToast(err.message, 'error');
        });
    };

    // AJAX Action: Update Cart Item Quantity
    function updateCartItemQuantity(productId, quantity) {
        const formData = new FormData();
        formData.append('quantity', quantity);
        formData.append('override', 'True');
        formData.append('csrfmiddlewaretoken', getCsrfToken());

        fetch(`/cart/api/add/${productId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderCart(data);
            } else {
                window.showToast(data.message, 'error');
            }
        })
        .catch(err => {
            console.error(err);
            window.showToast("Failed to update item quantity.", 'error');
        });
    }

    // AJAX Action: Remove Cart Item
    function removeCartItem(productId) {
        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', getCsrfToken());

        fetch(`/cart/api/remove/${productId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.showToast(data.message, 'success');
                renderCart(data);
            }
        })
        .catch(err => {
            console.error(err);
            window.showToast("Failed to remove item from cart.", 'error');
        });
    }

    // Hooks for Catalog List Quick Add Buttons
    const catalogAddBtns = document.querySelectorAll('.add-to-cart-btn');
    catalogAddBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            window.addToCart(productId, 1);
        });
    });

    // Helper: Slugify Product Names
    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start
            .replace(/-+$/, '');            // Trim - from end
    }
});
