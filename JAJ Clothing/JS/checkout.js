// Import Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDy19pPW93gdTisOsKwGw46rcjIMeu1ltM",
  authDomain: "jaj-clothing-22dbe.firebaseapp.com",
  projectId: "jaj-clothing-22dbe",
  storageBucket: "jaj-clothing-22dbe.firebasestorage.app",
  messagingSenderId: "154288386048",
  appId: "1:154288386048:web:a96b7a0bef1e9b2a6ba8e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// DISCOUNT TIERS - More aggressive to encourage larger orders
const DISCOUNT_TIERS = [
    { minAmount: 10000, discount: 0.30, label: '30% OFF' },  // ₱10000+ gets 30% off
    { minAmount: 7000, discount: 0.25, label: '25% OFF' },   // ₱7000+ gets 25% off
    { minAmount: 5000, discount: 0.20, label: '20% OFF' },   // ₱5000+ gets 20% off
    { minAmount: 3000, discount: 0.15, label: '15% OFF' },   // ₱3000+ gets 15% off
    { minAmount: 1500, discount: 0.12, label: '12% OFF' },   // ₱1500+ gets 12% off
    { minAmount: 1000, discount: 0.10, label: '10% OFF' },   // ₱1000+ gets 10% off
    { minAmount: 500, discount: 0.05, label: '5% OFF' },     // ₱500+ gets 5% off
];

// SHIPPING DISCOUNT TIERS - Very attractive to reduce cart abandonment
const SHIPPING_DISCOUNT_TIERS = [
    { minAmount: 2500, discount: 1.0, label: 'FREE SHIPPING' },      // ₱2500+ FREE shipping
    { minAmount: 1500, discount: 0.70, label: '70% OFF SHIPPING' },  // ₱1500+ 70% off
    { minAmount: 1000, discount: 0.50, label: '50% OFF SHIPPING' },  // ₱1000+ 50% off
    { minAmount: 700, discount: 0.40, label: '40% OFF SHIPPING' },   // ₱700+ 40% off
    { minAmount: 500, discount: 0.30, label: '30% OFF SHIPPING' },   // ₱500+ 30% off
    { minAmount: 300, discount: 0.20, label: '20% OFF SHIPPING' },   // ₱300+ 20% off
];

const BASE_SHIPPING_FEE = 150; // Base shipping fee

// Calculate discount based on subtotal
function calculateDiscount(subtotal) {
    for (const tier of DISCOUNT_TIERS) {
        if (subtotal >= tier.minAmount) {
            return {
                percentage: tier.discount,
                amount: subtotal * tier.discount,
                label: tier.label
            };
        }
    }
    return { percentage: 0, amount: 0, label: null };
}

// Calculate shipping discount based on subtotal
function calculateShippingDiscount(subtotal) {
    for (const tier of SHIPPING_DISCOUNT_TIERS) {
        if (subtotal >= tier.minAmount) {
            return {
                percentage: tier.discount,
                amount: BASE_SHIPPING_FEE * tier.discount,
                label: tier.label,
                originalFee: BASE_SHIPPING_FEE
            };
        }
    }
    return { 
        percentage: 0, 
        amount: 0, 
        label: null,
        originalFee: BASE_SHIPPING_FEE
    };
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// Ensure user is authenticated
function ensureAuthenticated() {
    return new Promise((resolve, reject) => {
        if (currentUser) {
            resolve(currentUser);
        } else {
            signInAnonymously(auth)
                .then(userCredential => {
                    currentUser = userCredential.user;
                    resolve(currentUser);
                })
                .catch(reject);
        }
    });
}

// Load saved customer information
function loadSavedCustomerInfo() {
    const savedInfo = localStorage.getItem('jajCustomerInfo');
    if (savedInfo) {
        return JSON.parse(savedInfo);
    }
    return null;
}

// Save customer information
function saveCustomerInfo(customerData) {
    localStorage.setItem('jajCustomerInfo', JSON.stringify(customerData));
}

// Auto-fill customer information form
function autoFillCustomerInfo() {
    const savedInfo = loadSavedCustomerInfo();
    if (savedInfo) {
        document.getElementById('jajFirstName').value = savedInfo.firstName || '';
        document.getElementById('jajLastName').value = savedInfo.lastName || '';
        document.getElementById('jajEmail').value = savedInfo.email || '';
        document.getElementById('jajPhone').value = savedInfo.phone || '';
        document.getElementById('jajAddress').value = savedInfo.address || '';
        document.getElementById('jajCity').value = savedInfo.city || '';
        document.getElementById('jajProvince').value = savedInfo.province || '';
        document.getElementById('jajZipCode').value = savedInfo.zipCode || '';
    }
}

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
            price: productPriceText,
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
    
    // Auto-fill customer information
    autoFillCustomerInfo();
    
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

// Populate checkout modal with items and totals (WITH DISCOUNT CALCULATION)
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
    const discount = calculateDiscount(subtotal);
    const subtotalAfterDiscount = subtotal - discount.amount;
    
    // Calculate shipping with discount
    const shippingDiscount = calculateShippingDiscount(subtotalAfterDiscount);
    const shippingFee = shippingDiscount.originalFee - shippingDiscount.amount;
    
    const finalTotal = subtotalAfterDiscount + shippingFee;
    
    let totalHTML = `
        <div class="jaj-total-row">
            <span>Subtotal:</span>
            <span>₱${subtotal.toLocaleString()}</span>
        </div>
    `;
    
    // Add product discount row if applicable
    if (discount.amount > 0) {
        totalHTML += `
            <div class="jaj-total-row jaj-discount-row">
                <span> Product Discount (${discount.label}):</span>
                <span class="jaj-discount-amount">-₱${discount.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        `;
    }
    
    // Always show next product discount tier to encourage more purchases
    const nextTier = DISCOUNT_TIERS.find(tier => subtotal < tier.minAmount);
    if (nextTier) {
        const amountNeeded = nextTier.minAmount - subtotal;
        totalHTML += `
            <div class="jaj-total-row jaj-discount-info jaj-promo-highlight">
                <span> Add ₱${amountNeeded.toLocaleString()} more to unlock ${nextTier.label}!</span>
            </div>
        `;
    } else if (!discount.amount) {
        // Show lowest tier if no discount yet
        const lowestTier = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
        const amountNeeded = lowestTier.minAmount - subtotal;
        if (amountNeeded > 0) {
            totalHTML += `
                <div class="jaj-total-row jaj-discount-info jaj-promo-highlight">
                    <span> Add ₱${amountNeeded.toLocaleString()} more to get ${lowestTier.label}!</span>
                </div>
            `;
        }
    }
    
    // Add shipping row with discount info
    if (shippingDiscount.amount > 0) {
        if (shippingDiscount.percentage === 1.0) {
            // Free shipping
            totalHTML += `
                <div class="jaj-total-row">
                    <span> Shipping: <span class="jaj-shipping-discount-badge">${shippingDiscount.label}</span></span>
                    <span><s style="color: #999;">₱${BASE_SHIPPING_FEE}</s> <span style="color: #27ae60; font-weight: 600;">FREE</span></span>
                </div>
            `;
        } else {
            // Partial shipping discount
            totalHTML += `
                <div class="jaj-total-row">
                    <span> Shipping: <span class="jaj-shipping-discount-badge">${shippingDiscount.label}</span></span>
                    <span><s style="color: #999;">₱${BASE_SHIPPING_FEE}</s> <span style="color: #27ae60; font-weight: 600;">₱${shippingFee.toLocaleString()}</span></span>
                </div>
            `;
        }
    } else {
        // No shipping discount
        totalHTML += `
            <div class="jaj-total-row">
                <span>Shipping:</span>
                <span>₱${shippingFee.toLocaleString()}</span>
            </div>
        `;
    }
    
    // Always show next shipping discount tier
    const nextShippingTier = SHIPPING_DISCOUNT_TIERS.find(tier => subtotalAfterDiscount < tier.minAmount);
    if (nextShippingTier) {
        const amountNeeded = nextShippingTier.minAmount - subtotalAfterDiscount;
        const savingsAmount = nextShippingTier.discount === 1.0 ? BASE_SHIPPING_FEE : BASE_SHIPPING_FEE * nextShippingTier.discount;
        totalHTML += `
            <div class="jaj-total-row jaj-discount-info jaj-shipping-promo">
                <span> Add ₱${amountNeeded.toLocaleString()} more for ${nextShippingTier.label}! (Save ₱${savingsAmount.toLocaleString()})</span>
            </div>
        `;
    } else if (!shippingDiscount.amount) {
        // Show lowest shipping tier if no discount yet
        const lowestShippingTier = SHIPPING_DISCOUNT_TIERS[SHIPPING_DISCOUNT_TIERS.length - 1];
        const amountNeeded = lowestShippingTier.minAmount - subtotalAfterDiscount;
        if (amountNeeded > 0) {
            totalHTML += `
                <div class="jaj-total-row jaj-discount-info jaj-shipping-promo">
                    <span> Add ₱${amountNeeded.toLocaleString()} more to get ${lowestShippingTier.label}!</span>
                </div>
            `;
        }
    }
    
    // Show total savings if any
    const totalSavings = discount.amount + shippingDiscount.amount;
    if (totalSavings > 0) {
        totalHTML += `
            <div class="jaj-total-row jaj-savings-highlight">
                <span> Your Total Savings:</span>
                <span style="color: #27ae60; font-weight: 700; font-size: 1.1em;">₱${totalSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        `;
    }
    
    totalHTML += `
        <div class="jaj-total-row jaj-final-total">
            <span>Total:</span>
            <span>₱${finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
    `;
    
    checkoutTotal.innerHTML = totalHTML;
    
    // Store checkout data globally
    window.checkoutData = {
        items,
        subtotal,
        discount: discount.amount,
        discountPercentage: discount.percentage,
        discountLabel: discount.label,
        shippingFee: shippingFee,
        shippingDiscount: shippingDiscount.amount,
        shippingDiscountLabel: shippingDiscount.label,
        originalShippingFee: BASE_SHIPPING_FEE,
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
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Place order function - Updated to save to Firebase with discount info
async function placeOrder() {
    const form = document.getElementById('jajCheckoutForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ensure user is authenticated before placing order
    try {
        await ensureAuthenticated();
    } catch (error) {
        console.error('Authentication failed:', error);
        alert('Unable to authenticate. Please try again.');
        return;
    }
    
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());
    
    // Save customer information
    saveCustomerInfo(customerData);
    
    const placeOrderBtn = document.querySelector('.jaj-btn-place-order');
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Processing...';
    placeOrderBtn.disabled = true;
    placeOrderBtn.style.background = '#ccc';
    
    try {
        // Create order object with PENDING status and discount info
        const order = {
            customerEmail: customerData.email,
            customerInfo: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                city: customerData.city,
                province: customerData.province,
                zipCode: customerData.zipCode
            },
            items: window.checkoutData.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                image: item.image
            })),
            subtotal: window.checkoutData.subtotal,
            discount: window.checkoutData.discount,
            discountPercentage: window.checkoutData.discountPercentage,
            discountLabel: window.checkoutData.discountLabel,
            shippingFee: window.checkoutData.shippingFee,
            shippingDiscount: window.checkoutData.shippingDiscount,
            shippingDiscountLabel: window.checkoutData.shippingDiscountLabel,
            originalShippingFee: window.checkoutData.originalShippingFee,
            total: window.checkoutData.total,
            paymentMethod: customerData.paymentMethod,
            status: 'pending',
            orderDate: serverTimestamp(),
            userId: currentUser ? currentUser.uid : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Add order to Firebase
        const docRef = await addDoc(collection(db, 'orders'), order);
        
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
        showOrderSuccessModal({...order, id: docRef.id});
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        // Reset button
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.background = '';
    }
}

// Show order success modal with discount info
function showOrderSuccessModal(order) {
    const successModal = document.createElement('div');
    successModal.className = 'jaj-order-success-modal show';
    
    let discountInfo = '';
    if (order.discount > 0) {
        discountInfo = `<p><strong>Product Discount:</strong> ${order.discountLabel} (-₱${order.discount.toLocaleString()})</p>`;
    }
    
    let shippingInfo = '';
    if (order.shippingDiscount > 0) {
        shippingInfo = `<p><strong>Shipping Discount:</strong> ${order.shippingDiscountLabel} (-₱${order.shippingDiscount.toLocaleString()})</p>`;
    }
    
    let totalSavings = (order.discount || 0) + (order.shippingDiscount || 0);
    let savingsInfo = '';
    if (totalSavings > 0) {
        savingsInfo = `<p style="color: #27ae60; font-weight: 600;"><strong>Total Savings:</strong> ₱${totalSavings.toLocaleString()}</p>`;
    }
    
    successModal.innerHTML = `
        <div class="jaj-order-success-content">
            <div class="jaj-success-icon">✓</div>
            <h3>Pending Order!</h3>
            <p>Your order has been received and is currently under review.</p>
            <div class="jaj-order-details">
                <p><strong>Order ID:</strong> #${order.id.substring(0, 8)}...</p>
                ${discountInfo}
                ${shippingInfo}
                ${savingsInfo}
                <p><strong>Total:</strong> ₱${order.total.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Estimated Processing Time:</strong> 1-2 business days</p>
                <p><strong>Delivery Time:</strong> 3-5 days after confirmation</p>
            </div>
            
            <div class="jaj-success-actions">
                <button class="jaj-btn-primary" onclick="closeSuccessModal(this)">Continue Shopping</button>
                <button class="jaj-btn-secondary" onclick="viewOrderHistory()">Check Order Status</button>
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

// View order history
function viewOrderHistory() {
    const modal = document.querySelector('.jaj-order-success-modal');
    if (modal) {
        modal.remove();
    }
    // Redirect to order history page
    window.location.href = 'Orderhistory.html';
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
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
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
    updateCartCount();
    
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('jajCheckoutModal');
        if (modal && modal.classList.contains('show')) {
            if (e.key === 'Escape') {
                closeCheckoutModal();
            }
        }
    });
});

// Make functions globally available
window.proceedToCheckout = proceedToCheckout;
window.closeSuccessModal = closeSuccessModal;
window.buyNow = buyNow;
window.closeCheckoutModal = closeCheckoutModal;
window.placeOrder = placeOrder;
window.viewOrderHistory = viewOrderHistory;