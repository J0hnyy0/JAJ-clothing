// Product Page JavaScript
let selectedSize = 'M';
let selectedColor = 'black';
let currentImageIndex = 0;
let isProfileDropdownOpen = false;
let pendingCartItem = null; // Store item temporarily

// Default images array
let images = [
    'clothings/Shirts.png',
    'clothings/Shorts.png',
    'clothings/Hoodies.png',
    'clothings/tblack.png',
    'clothings/twhite.png',
    'clothings/sblack.png',
    'clothings/swhite.png',
    'clothings/tcb.png',
    'clothings/tcw.png',
    'clothings/lblack.png',
    'clothings/lwhite.png',
    'clothings/hblack.png',
    'clothings/hwhite.png',
    'clothings/1hb.png',
    'clothings/1hw.png',
    'clothings/zblack.png',
    'clothings/zwhite.png',
    'clothings/zb1.png',
    'clothings/zw1.png',
    'clothings/sb2.png',
    'clothings/sw2.png',
    'clothings/lb3.png',
    'clothings/lw3.png',
    'clothings/llb4.png',
    'clothings/llw4.png',
    'clothings/3hb.png',
    'clothings/3hw.png',
    'clothings/4hw.png',
    'clothings/4hb.png'
];

// Load product data from localStorage
window.addEventListener('DOMContentLoaded', function() {
    const storedProduct = localStorage.getItem('selectedProduct');
    if (storedProduct) {
        const product = JSON.parse(storedProduct);

        // Set product title
        document.querySelector('.product-title').textContent = product.name;

        // Set product price
        document.querySelector('.product-price').textContent = product.price;

        // Set product description
        document.querySelector('.product-description').textContent = product.description;

        // Set images for each product type and item
        let productImages = [];
        let showSizeOptions = true;
        let sizeList = [];

        switch (product.category) {
            case 'tops':
                if (product.id === 'classic-tshirt') {
                    productImages = [
                        'clothings/tblack.png',
                        'clothings/twhite.png',
                        'clothings/Shirts.png'
                    ];
                } else if (product.id === 'sleeveless-sando') {
                    productImages = [
                        'clothings/nblack.png',
                        'clothings/nwhite.png',
                        'clothings/Shirts.png'
                    ];
                } else if (product.id === 'crop-tshirt') {
                    productImages = [
                        'clothings/tcb.png',
                        'clothings/tcw.png',
                        'clothings/Shirts.png'
                    ];
                } else if (product.id === 'long-sleeve') {
                    productImages = [
                        'clothings/lblack.png',
                        'clothings/lwhite.png',
                        'clothings/Shirts.png'
                    ];
                }
                sizeList = ['XS', 'S', 'G', 'M', 'L', 'XL', '2XL', '3XL'];
                break;
            case 'hoodies':
                if (product.id === 'classic-hoodie-white') {
                    productImages = [
                        'clothings/hblack.png',
                        'clothings/hwhite.png',
                        'clothings/Hoodies.png'
                    ];
                } else if (product.id === 'classic-hoodie-white2') {
                    productImages = [
                        'clothings/hb1.png',
                        'clothings/hw1.png',
                        'clothings/Hoodies.png'
                    ];
                } else if (product.id === 'zip-hoodie-blue') {
                    productImages = [
                        'clothings/zblack.png',
                        'clothings/zwhite.png',
                        'clothings/Hoodies.png'
                    ];
                } else if (product.id === 'zip-hoodie-black') {
                    productImages = [
                        'clothings/zb1.png',
                        'clothings/zw1.png',
                        'clothings/Hoodies.png'
                    ];
                }
                sizeList = ['M', 'L', 'XL', '2XL'];
                break;
            case 'shorts':
                if (product.id === 'classic-shorts') {
                    productImages = [
                        'clothings/sblack.png',
                        'clothings/swhite.png',
                        'clothings/Shorts.png'
                    ];
                } else if (product.id === 'cargo-shorts') {
                    productImages = [
                        'clothings/sb2.png',
                        'clothings/sw2.png',
                        'clothings/Shorts.png'
                    ];
                } else if (product.id === 'sweatpants') {
                    productImages = [
                        'clothings/lb3.png',
                        'clothings/lw3.png',
                        'clothings/Shorts.png'
                    ];
                } else if (product.id === 'leggings') {
                    productImages = [
                        'clothings/llb4.png',
                        'clothings/llw4.png',
                        'clothings/Shorts.png'
                    ];
                }
                sizeList = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
                break;
            case 'hats':
                if (product.id === 'classic-cap') {
                    productImages = [
                        'clothings/1hb.png',
                        'clothings/1hw.png'
                    ];
                } else if (product.id === 'bucket-hat') {
                    productImages = [
                        'clothings/2hbb.png',
                        'clothings/2hww.png'
                    ];
                } else if (product.id === 'beanie-hat') {
                    productImages = [
                        'clothings/3hb.png',
                        'clothings/3hw.png'
                    ];
                } else if (product.id === 'mickey-ears-hat') {
                    productImages = [
                        'clothings/4hb.png',
                        'clothings/4hw.png'
                    ];
                }
                showSizeOptions = false;
                break;
            default:
                productImages = [product.image, product.image, product.image];
        }

        // Update images array and UI
        images = productImages;
        document.getElementById('mainImage').src = images[0];
        document.querySelectorAll('.thumbnail img').forEach((img, i) => {
            img.src = images[i] || images[0];
            // Hide extra thumbnails for hats
            if (product.category === 'hats' && i > 1) {
                img.parentElement.style.display = 'none';
            } else {
                img.parentElement.style.display = '';
            }
        });

        // Update size options
        const sizeOptionsDiv = document.querySelector('.size-options');
        const sizeLabel = document.querySelector('.option-label[for="size"]');
        if (showSizeOptions && sizeOptionsDiv) {
            sizeOptionsDiv.innerHTML = '';
            sizeList.forEach((size) => {
                const btn = document.createElement('button');
                btn.className = 'size-option' + (size === selectedSize ? ' active' : '');
                btn.textContent = size;
                btn.onclick = function() { selectSize(btn); };
                sizeOptionsDiv.appendChild(btn);
            });
            if (sizeLabel) sizeLabel.style.display = '';
            sizeOptionsDiv.style.display = '';
        } else if (sizeOptionsDiv) {
            sizeOptionsDiv.style.display = 'none';
            if (sizeLabel) sizeLabel.style.display = 'none';
        }

        // Update page title to match product name
        document.title = `${product.name} - JAJ Clothing`;
    }

    // Initialize cart and event listeners
    selectedSize = 'M';
    selectedColor = 'black';
    currentImageIndex = 0;
    updateCartCount();
    updateCartDisplay();

    // Update thumbnail click to show correct image
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.onclick = function() {
            changeImage(images[i], i);
        };
    });

    // Add event listeners for Buy Now and Proceed to Checkout buttons
    const buyNowBtn = document.getElementById('buyNowButton');
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => buyNow()); // Calls buyNow from checkout.js
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => proceedToCheckout()); // Calls proceedToCheckout from checkout.js
    }

    // Close cart popup when clicking outside
    const cartPopup = document.getElementById('cartPopup');
    if (cartPopup) {
        cartPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCartPopup();
            }
        });
    }
});

function changeImage(src, index) {
    document.getElementById('mainImage').src = src;
    currentImageIndex = index;
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

function changeImageByIndicator(index) {
    changeImage(images[index], index);
}

function selectColor(color, colorName) {
    selectedColor = color;
    document.getElementById('selectedColor').textContent = colorName;
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
    document.getElementById('mainImage').src = images[currentImageIndex];
    document.querySelectorAll('.indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === currentImageIndex);
    });
}

function selectSize(element) {
    selectedSize = element.textContent;
    document.querySelectorAll('.size-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    quantityInput.value = currentValue + 1;
}

function addToCart() {
    const productTitle = document.querySelector('.product-title').textContent;
    const productPrice = document.querySelector('.product-price').textContent;
    const selectedColor = document.getElementById('selectedColor').textContent;
    const selectedSize = document.querySelector('.size-option.active')?.textContent;
    const quantity = parseInt(document.getElementById('quantity').value);
    
    // Validate selections
    if (!selectedSize) {
        alert('Please select a size');
        return;
    }
    
    if (quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }
    
    // Create cart item object
    const cartItem = {
        id: 'cargo-shorts-' + selectedColor.toLowerCase() + '-' + selectedSize.toLowerCase(),
        name: productTitle,
        price: parseFloat(productPrice.replace('₱', '').replace(',', '')),
        color: selectedColor,
        size: selectedSize,
        quantity: quantity,
        image: document.getElementById('mainImage').src
    };
    
    // Store pending item and show confirmation popup
    pendingCartItem = cartItem;
    document.getElementById('cartPopupMessage').textContent = 
        `Add ${cartItem.name} (${cartItem.color}, Size ${cartItem.size}) to your cart?`;
    document.getElementById('cartPopup').classList.add('show');
}

function confirmAddToCart() {
    if (!pendingCartItem) return;
    
    // Get existing cart items
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => 
        item.id === pendingCartItem.id
    );
    
    if (existingItemIndex > -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += pendingCartItem.quantity;
    } else {
        // Add new item to cart
        cartItems.push(pendingCartItem);
    }
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Update cart count
    updateCartCount();
    updateCartDisplay();
    
    // Close popup
    closeCartPopup();
    
    // Show success message
    showNotification('Item added to cart successfully!');
    
    // Clear pending item
    pendingCartItem = null;
}

function closeCartPopup() {
    const cartPopup = document.getElementById('cartPopup');
    if (cartPopup) {
        cartPopup.classList.remove('show');
    }
    pendingCartItem = null;
}

function updateCartSidebar() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItemsContainer || !cartTotal) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'Total: ₱0.00';
        return;
    }

    cartItems.forEach((item, index) => {
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString().replace('₱', '').replace(',', ''));
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <button class="delete-cart-btn" onclick="deleteCartItem(${index})" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
                    </svg>
                </button>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₱${itemPrice.toFixed(2)}</div>
                <div class="cart-item-options">Color: ${item.color} | Size: ${item.size}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotal.textContent = `Total: ₱${total.toFixed(2)}`;
}

function updateQuantity(index, change) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cartItems[index]) {
        cartItems[index].quantity += change;
        
        if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
        }
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        updateCartSidebar();
        updateCartDisplay();
    }
}

function deleteCartItem(index) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cartItems.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
    updateCartSidebar();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function updateCartDisplay() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsContainer || !cartTotal) return;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'Total: ₱0.00';
        return;
    }
    
    cartItemsContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₱${item.price.toLocaleString()}</div>
                <div class="cart-item-options">Color: ${item.color} | Size: ${item.size}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                </div>
                <button class="delete-cart-btn" onclick="deleteCartItem(${index})" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `Total: ₱${total.toLocaleString()}`;
}

function updateCartItemQuantity(index, change) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    if (cartItems[index]) {
        cartItems[index].quantity += change;
        
        if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
        }
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        updateCartDisplay();
    }
}

function removeFromCart(index) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cartItems.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
        updateCartDisplay();
    }
}

function confirmLogout() {
    closeLogoutPopup();
    logout();
}

function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                updateAuthState();
                window.location.href = 'Register.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
            });
    } else {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        updateAuthState();
        window.location.href = 'Register.html';
    }
}

function updateAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    
    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (isLoggedIn && userName && authButtons && profileMenu) {
        authButtons.classList.add('hide');
        profileMenu.classList.add('show');
        profileName.textContent = userName;
        profileAvatar.textContent = userName.charAt(0).toUpperCase();
    } else {
        if (authButtons) authButtons.classList.remove('hide');
        if (profileMenu) profileMenu.classList.remove('show');
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    isProfileDropdownOpen = !isProfileDropdownOpen;
    if (isProfileDropdownOpen) {
        dropdown.classList.add('show');
    } else {
        dropdown.classList.remove('show');
    }
}

document.addEventListener('click', function(event) {
    const profileMenu = document.getElementById('profileMenu');
    const dropdown = document.getElementById('profileDropdown');
    if (profileMenu && !profileMenu.contains(event.target) && isProfileDropdownOpen) {
        dropdown.classList.remove('show');
        isProfileDropdownOpen = false;
    }
});

window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId) {
        console.log('Loading product:', productId);
    }
    updateCartCount();
    updateCartSidebar();
});

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    changeImage(images[currentImageIndex], currentImageIndex);
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    changeImage(images[currentImageIndex], currentImageIndex);
}