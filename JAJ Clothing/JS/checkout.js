// Main checkout initiation function
function proceedToCheckout() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cartItems.length === 0) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('Your cart is empty. Please add items before proceeding to checkout.');
        } else {
            alert('Your cart is empty. Please add items before proceeding to checkout.');
        }
        return;
    }
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    openCheckoutModal(cartItems, 'cart');
}

// Buy now function (for product.js only)
function buyNow() {
    const productTitle = document.querySelector('.product-title')?.textContent || 'Product';
    const productPriceText = document.querySelector('.product-price')?.textContent || '₱0';
    const selectedColorText = document.getElementById('selectedColor')?.textContent || 'black';
    const selectedSizeElement = document.querySelector('.size-option.active');
    const selectedSizeText = selectedSizeElement?.textContent || 'M';
    const quantity = parseInt(document.getElementById('quantity')?.value || '1');
    
    // Validation for product page
    if (!selectedSizeElement && document.querySelector('.size-option')) {
        alert('Please select a size');
        return;
    }
    
    if (quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }
    
    // Get stored product data or create fallback
    const storedProduct = localStorage.getItem('selectedProduct');
    let productData;
    
    if (storedProduct) {
        productData = JSON.parse(storedProduct);
    } else {
        productData = {
            id: 'product-' + Date.now(),
            name: productTitle,
            price: 554.99,
            color: selectedColorText,
            size: selectedSizeText,
            image: document.getElementById('mainImage')?.src || 'clothings/Shirts.png'
        };
    }
    
    // Update product data with current selections
    productData.color = selectedColorText;
    productData.size = selectedSizeText;
    productData.quantity = quantity;
    productData.image = document.getElementById('mainImage')?.src || productData.image;
    
    // Ensure price is a number
    if (typeof productData.price === 'string') {
        productData.price = parseFloat(productData.price.replace('₱', '').replace(',', ''));
    }
    
    openCheckoutModal([productData], 'quick');
}

// Create and open checkout modal
function openCheckoutModal(items, type) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Remove existing modal
    const existingModal = document.getElementById('jajCheckoutModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create new modal
    const modal = createCheckoutModal();
    document.body.appendChild(modal);
    
    // Populate modal with data
    populateCheckoutModal(items, total, type);
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Create checkout modal HTML structure
function createCheckoutModal() {
    const modal = document.createElement('div');
    modal.id = 'jajCheckoutModal';
    modal.className = 'jaj-checkout-modal';
    
    modal.innerHTML = `
        <div class="jaj-checkout-content">
            <div class="jaj-checkout-header">
                <h2>Checkout</h2>
                <button class="jaj-checkout-close-btn" onclick="closeCheckoutModal()">×</button>
            </div>
            
            <div class="jaj-checkout-body">
                <div class="jaj-checkout-section">
                    <h3>Order Summary</h3>
                    <div class="jaj-checkout-items" id="jajCheckoutItems"></div>
                    <div class="jaj-checkout-total" id="jajCheckoutTotal"></div>
                </div>
                
                <div class="jaj-checkout-section">
                    <h3>Customer Information</h3>
                    <form id="jajCheckoutForm" class="jaj-checkout-form">
                        <div class="jaj-form-row">
                            <div class="jaj-form-group">
                                <label for="jajFirstName">First Name *</label>
                                <input type="text" id="jajFirstName" name="firstName" required>
                            </div>
                            <div class="jaj-form-group">
                                <label for="jajLastName">Last Name *</label>
                                <input type="text" id="jajLastName" name="lastName" required>
                            </div>
                        </div>
                        
                        <div class="jaj-form-group">
                            <label for="jajEmail">Email Address *</label>
                            <input type="email" id="jajEmail" name="email" required>
                        </div>
                        
                        <div class="jaj-form-group">
                            <label for="jajPhone">Phone Number *</label>
                            <input type="tel" id="jajPhone" name="phone" required>
                        </div>
                        
                        <h4>Shipping Address</h4>
                        <div class="jaj-form-group">
                            <label for="jajAddress">Street Address *</label>
                            <input type="text" id="jajAddress" name="address" required>
                        </div>
                        
                        <div class="jaj-form-row">
                            <div class="jaj-form-group">
                                <label for="jajCity">City *</label>
                                <input type="text" id="jajCity" name="city" required>
                            </div>
                            <div class="jaj-form-group">
                                <label for="jajProvince">Province *</label>
                                <select id="jajProvince" name="province" required>
                                    <option value="">Select Province</option>
                                    <option value="Metro Manila">Metro Manila</option>
                                    <option value="Cebu">Cebu</option>
                                    <option value="Davao">Davao</option>
                                    <option value="Iloilo">Iloilo</option>
                                    <option value="Laguna">Laguna</option>
                                    <option value="Cavite">Cavite</option>
                                    <option value="Bulacan">Bulacan</option>
                                    <option value="Negros Occidental">Negros Occidental</option>
                                    <option value="Pangasinan">Pangasinan</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="jaj-form-group">
                            <label for="jajZipCode">ZIP Code *</label>
                            <input type="text" id="jajZipCode" name="zipCode" required>
                        </div>
                        
                        <h4>Payment Method</h4>
                        <div class="jaj-payment-methods">
                            <label class="jaj-payment-option">
                                <input type="radio" name="paymentMethod" value="cod" checked>
                                <div>
                                    <span class="jaj-payment-label">Cash on Delivery (COD)</span>
                                    <br><small>Pay when your order arrives</small>
                                </div>
                            </label>
                            <label class="jaj-payment-option">
                                <input type="radio" name="paymentMethod" value="gcash">
                                <div>
                                    <span class="jaj-payment-label">GCash</span>
                                    <br><small>Digital wallet payment</small>
                                </div>
                            </label>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="jaj-checkout-footer">
                <button class="jaj-btn-cancel" onclick="closeCheckoutModal()">Cancel</button>
                <button class="jaj-btn-place-order" onclick="placeOrder()">Place Order</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Populate checkout modal with items and totals
function populateCheckoutModal(items, total, type) {
    const checkoutItems = document.getElementById('jajCheckoutItems');
    const checkoutTotal = document.getElementById('jajCheckoutTotal');
    
    checkoutItems.innerHTML = items.map(item => `
        <div class="jaj-checkout-item">
            <img src="${item.image}" alt="${item.name}" class="jaj-checkout-item-image">
            <div class="jaj-checkout-item-details">
                <div class="jaj-checkout-item-name">${item.name}</div>
                <div class="jaj-checkout-item-options">${item.color}, Size ${item.size}</div>
                <div class="jaj-checkout-item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="jaj-checkout-item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');
    
    const subtotal = total;
    const shipping = subtotal >= 1000 ? 0 : 150;
    const finalTotal = subtotal + shipping;
    
    checkoutTotal.innerHTML = `
        <div class="jaj-total-row">
            <span>Subtotal:</span>
            <span>₱${subtotal.toLocaleString()}</span>
        </div>
        <div class="jaj-total-row">
            <span>Shipping:</span>
            <span>${shipping === 0 ? 'FREE' : '₱' + shipping.toLocaleString()}</span>
        </div>
        <div class="jaj-total-row jaj-final-total">
            <span>Total:</span>
            <span>₱${finalTotal.toLocaleString()}</span>
        </div>
    `;
    
    // Store checkout data globally
    window.checkoutData = {
        items,
        subtotal,
        shipping,
        total: finalTotal,
        type
    };
}

// Close checkout modal
function closeCheckoutModal() {
    const modal = document.getElementById('jajCheckoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        // Remove modal after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Place order function
function placeOrder() {
    const form = document.getElementById('jajCheckoutForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());
    
    const order = {
        id: 'ORDER-' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: customerData,
        items: window.checkoutData.items,
        subtotal: window.checkoutData.subtotal,
        shipping: window.checkoutData.shipping,
        total: window.checkoutData.total,
        status: 'pending'
    };
    
    const placeOrderBtn = document.querySelector('.jaj-btn-place-order');
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Processing...';
    placeOrderBtn.disabled = true;
    placeOrderBtn.style.background = '#ccc';
    
    // Simulate processing time
    setTimeout(() => {
        // Save order to localStorage
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart if checkout from cart
        if (window.checkoutData.type === 'cart') {
            localStorage.removeItem('cartItems');
            updateCartCount();
            if (typeof updateCartSidebar === 'function') {
                updateCartSidebar();
            }
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            }
        }
        
        closeCheckoutModal();
        showOrderSuccessModal(order);
        
        // Reset button
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.background = ''; // Reset to CSS-defined style
    }, 2000);
}

// Show order success modal
function showOrderSuccessModal(order) {
    const successModal = document.createElement('div');
    successModal.className = 'jaj-order-success-modal show';
    
    successModal.innerHTML = `
        <div class="jaj-order-success-content">
            <div class="jaj-success-icon">✓</div>
            <h3>Order Placed Successfully!</h3>
            <p>Your order <strong>${order.id}</strong> has been received.</p>
            <div class="jaj-order-details">
                <p><strong>Total:</strong> ₱${order.total.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.customer.paymentMethod.toUpperCase()}</p>
                <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
            </div>
            <div class="jaj-success-actions">
                <button class="jaj-btn-primary" onclick="closeSuccessModal(this)">Continue Shopping</button>
                <button class="jaj-btn-secondary" onclick="viewOrderDetails('${order.id}')">View Order Details</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
}

// Close success modal
function closeSuccessModal(button) {
    const modal = button.closest('.jaj-order-success-modal');
    if (modal) {
        modal.remove();
    }
}

// View order details (placeholder)
function viewOrderDetails(orderId) {
    alert(`Order details for ${orderId} would be shown here. This could redirect to an order tracking page.`);
    const modal = document.querySelector('.jaj-order-success-content');
    if (modal) {
        modal.closest('.jaj-order-success-modal').remove();
    }
}

// Update cart count
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartCount = document.getElementById('cartCount');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) {
        cartCount.textContent = totalItems;
        if (totalItems > 0) {
            cartCount.classList.add('show');
        } else {
            cartCount.classList.remove('show');
        }
    }
}

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `jaj-notification jaj-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize checkout functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count on page load
    updateCartCount();
    
    // Add keyboard shortcuts for checkout modal
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('jajCheckoutModal');
        if (modal && modal.classList.contains('show')) {
            if (e.key === 'Escape') {
                closeCheckoutModal();
            }
        }
    });
});