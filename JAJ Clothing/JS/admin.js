// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// Simulated data stores (replacing Firebase)
let users = [];
let products = [];
let orders = [];

// DOM Elements with null checks
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const authForm = document.getElementById('auth-form');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logout-btn');
    const addProductBtn = document.querySelector('.add-product-btn');
    const modal = document.querySelector('.modal');
    const closeModalBtn = document.querySelector('.modal-content .close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const saveProductBtn = document.querySelector('.save-btn');
    const userTableBody = document.getElementById('user-table-body');
    const productTableBody = document.getElementById('product-table-body');
    const orderTableBody = document.getElementById('order-table-body');
    const totalUsersCard = document.querySelector('.dashboard-overview .card:nth-child(1) p');
    const totalProductsCard = document.querySelector('.dashboard-overview .card:nth-child(2) p');
    const totalOrdersCard = document.querySelector('.dashboard-overview .card:nth-child(3) p');
    const totalRevenueCard = document.querySelector('.dashboard-overview .card:nth-child(4) p');

    // Function to show error messages
    function showError(message) {
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = message;
            console.error(message);
        } else {
            console.error('Error message element not found:', message);
        }
    }

    // Function to toggle views
    function showLogin() {
        if (loginContainer && dashboardContainer) {
            loginContainer.classList.remove('hidden');
            loginContainer.classList.add('show');
            dashboardContainer.classList.remove('show');
            dashboardContainer.classList.add('hidden');
            console.log('Showing login view');
        } else {
            console.error('Login or dashboard container not found');
            showError('UI error: Containers not found. Please refresh the page.');
        }
    }

    function showDashboard() {
        if (loginContainer && dashboardContainer) {
            loginContainer.classList.remove('show');
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            dashboardContainer.classList.add('show');
            console.log('Showing dashboard view');
            fetchUsers();
            fetchProducts();
            fetchOrders();
        } else {
            console.error('Login or dashboard container not found');
            showError('UI error: Containers not found. Please refresh the page.');
        }
    }

    // Auto-login function
    window.autoLogin = function() {
        if (errorMessage) errorMessage.style.display = 'none';
        localStorage.setItem('isAuthenticated', 'true');
        showDashboard();
        console.log('Auto-login successful');
    };

    // Check authentication status
    if (localStorage.getItem('isAuthenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }

    // Login form handler
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (errorMessage) errorMessage.style.display = 'none';
            const username = document.getElementById('adminUsername')?.value;
            const password = document.getElementById('adminPassword')?.value;

            if (!username || !password) {
                showError('Please fill in all fields.');
                return;
            }

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                localStorage.setItem('isAuthenticated', 'true');
                showDashboard();
                console.log('Manual login successful');
            } else {
                showError('Incorrect username or password!');
            }
        });
    } else {
        console.error('Auth form not found');
        showError('Login form not found. Please refresh the page.');
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            showLogin();
            console.log('Logout successful');
        });
    }

    // Function to create an order
    async function createOrder(orderData) {
        try {
            const orderId = 'ORD-' + Date.now();
            const order = {
                id: orderId,
                customerEmail: orderData.customerEmail || 'anonymous@example.com',
                items: orderData.items || [],
                total: orderData.total || 0,
                status: 'pending',
                paymentMethod: orderData.paymentMethod || 'pending',
                shippingAddress: orderData.shippingAddress || {},
                orderDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            orders.push(order);
            console.log('Order created successfully with ID:', orderId);
            return {
                success: true,
                orderId: orderId,
                message: 'Order created successfully!'
            };
        } catch (error) {
            console.error('Error creating order:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to create order. Please try again.'
            };
        }
    }

    // Function to handle checkout process
    async function processCheckout(cartItems, customerInfo = {}) {
        try {
            if (!cartItems || cartItems.length === 0) {
                throw new Error('Cart is empty');
            }

            const total = cartItems.reduce((sum, item) => {
                const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString().replace('₱', '').replace(',', ''));
                return sum + (itemPrice * item.quantity);
            }, 0);

            const items = cartItems.map(item => ({
                productId: item.id,
                name: item.name,
                price: typeof item.price === 'number' ? item.price : parseFloat(item.price.toString().replace('₱', '').replace(',', '')),
                quantity: item.quantity,
                color: item.color || '',
                size: item.size || '',
                image: item.image || ''
            }));

            const orderData = {
                items: items,
                total: total,
                paymentMethod: customerInfo.paymentMethod || 'pending',
                customerEmail: customerInfo.email || 'anonymous@example.com',
                shippingAddress: {
                    fullName: customerInfo.fullName || '',
                    address: customerInfo.address || '',
                    city: customerInfo.city || '',
                    postalCode: customerInfo.postalCode || '',
                    phone: customerInfo.phone || ''
                }
            };

            const result = await createOrder(orderData);
            
            if (result.success) {
                localStorage.removeItem('cart');
                if (typeof updateCartCount === 'function') {
                    updateCartCount();
                }
                if (typeof updateCartSidebar === 'function') {
                    updateCartSidebar();
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error processing checkout:', error);
            return {
                success: false,
                error: error.message,
                message: 'Checkout failed. Please try again.'
            };
        }
    }

    // Function to handle "Buy Now" orders
    async function processBuyNow(productData, quantity = 1, customerInfo = {}) {
        try {
            const items = [{
                productId: productData.id,
                name: productData.name,
                price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price.toString().replace('₱', '').replace(',', '')),
                quantity: quantity,
                color: productData.color || '',
                size: productData.size || '',
                image: productData.image || ''
            }];

            const total = items[0].price * quantity;

            const orderData = {
                items: items,
                total: total,
                paymentMethod: customerInfo.paymentMethod || 'pending',
                customerEmail: customerInfo.email || 'anonymous@example.com',
                shippingAddress: {
                    fullName: customerInfo.fullName || '',
                    address: customerInfo.address || '',
                    city: customerInfo.city || '',
                    postalCode: customerInfo.postalCode || '',
                    phone: customerInfo.phone || ''
                }
            };

            return await createOrder(orderData);
        } catch (error) {
            console.error('Error processing buy now:', error);
            return {
                success: false,
                error: error.message,
                message: 'Order failed. Please try again.'
            };
        }
    }

    // Function to fetch and display users
    function fetchUsers() {
        if (!userTableBody || !totalUsersCard) {
            console.error('User table elements not found');
            return;
        }
        userTableBody.innerHTML = '';
        totalUsersCard.textContent = users.length;
        
        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
            return;
        }

        users.forEach((user, index) => {
            const row = `
                <tr>
                    <td>${user.email}</td>
                    <td>${user.status || 'Active'}</td>
                    <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td class="actions">
                        <a href="#" class="action-btn" onclick="toggleUserStatus('${index}')">Toggle Status</a>
                    </td>
                </tr>
            `;
            userTableBody.innerHTML += row;
        });
    }

    // Function to toggle user status
    window.toggleUserStatus = function(index) {
        try {
            users[index].status = users[index].status === 'Active' ? 'Suspended' : 'Active';
            users[index].updatedAt = new Date();
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            showError(`Failed to toggle user status: ${error.message}`);
        }
    };

    // Function to fetch and display products
    function fetchProducts() {
        if (!productTableBody || !totalProductsCard) {
            console.error('Product table elements not found');
            return;
        }
        productTableBody.innerHTML = '';
        totalProductsCard.textContent = products.length;

        if (products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
            return;
        }

        products.forEach((product, index) => {
            const row = `
                <tr>
                    <td><img src="${product.image}" alt="${product.name}" width="50"></td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>₱${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${product.status || 'Available'}</td>
                    <td class="actions">
                        <a href="#" class="action-btn" onclick="editProduct('${index}')">Edit</a>
                        <a href="#" class="action-btn delete" onclick="deleteProduct('${index}')">Delete</a>
                    </td>
                </tr>
            `;
            productTableBody.innerHTML += row;
        });
    }

    // Function to add a product
    async function addProduct(event) {
        event.preventDefault();
        const productName = document.querySelector('#product-name')?.value;
        const category = document.querySelector('#category')?.value;
        const price = parseFloat(document.querySelector('#price')?.value);
        const stock = parseInt(document.querySelector('#stock')?.value);
        const description = document.querySelector('#description')?.value;
        const image = document.querySelector('#image-url')?.value;

        if (!productName || !category || !price || !stock || !description || !image) {
            showError('Missing product form data');
            return;
        }

        try {
            const product = {
                id: 'PROD-' + Date.now(),
                name: productName,
                category: category,
                price: price,
                stock: stock,
                description: description,
                image: image,
                status: 'Available',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            products.push(product);
            modal.classList.remove('show');
            document.querySelector('#product-form').reset();
            fetchProducts();
        } catch (error) {
            console.error('Error adding product:', error);
            showError(`Failed to add product: ${error.message}`);
        }
    }

    // Function to edit a product
    window.editProduct = function(index) {
        try {
            const product = products[index];
            document.querySelector('#product-name').value = product.name;
            document.querySelector('#category').value = product.category;
            document.querySelector('#price').value = product.price;
            document.querySelector('#stock').value = product.stock;
            document.querySelector('#description').value = product.description;
            document.querySelector('#image-url').value = product.image;

            modal.classList.add('show');
            saveProductBtn.onclick = async (event) => {
                event.preventDefault();
                try {
                    products[index] = {
                        ...products[index],
                        name: document.querySelector('#product-name').value,
                        category: document.querySelector('#category').value,
                        price: parseFloat(document.querySelector('#price').value),
                        stock: parseInt(document.querySelector('#stock').value),
                        description: document.querySelector('#description').value,
                        image: document.querySelector('#image-url').value,
                        updatedAt: new Date()
                    };
                    modal.classList.remove('show');
                    document.querySelector('#product-form').reset();
                    fetchProducts();
                } catch (error) {
                    console.error('Error updating product:', error);
                    showError(`Failed to update product: ${error.message}`);
                }
            };
        } catch (error) {
            console.error('Error editing product:', error);
            showError(`Failed to edit product: ${error.message}`);
        }
    };

    // Function to delete a product
    window.deleteProduct = function(index) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                products.splice(index, 1);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                showError(`Failed to delete product: ${error.message}`);
            }
        }
    };

    // Function to fetch and display orders
    function fetchOrders() {
        if (!orderTableBody || !totalOrdersCard || !totalRevenueCard) {
            console.error('Order table elements not found');
            return;
        }
        orderTableBody.innerHTML = '';
        totalOrdersCard.textContent = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        totalRevenueCard.textContent = `₱${totalRevenue.toFixed(2)}`;

        if (orders.length === 0) {
            orderTableBody.innerHTML = '<tr><td colspan="7">No orders found</td></tr>';
            return;
        }

        orders.forEach((order, index) => {
            const row = `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customerEmail}</td>
                    <td>${order.items.map(item => item.name).join(', ')}</td>
                    <td>₱${order.total.toFixed(2)}</td>
                    <td>
                        <select onchange="updateOrderStatus('${index}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                    <td class="actions">
                        <a href="#" class="action-btn delete" onclick="deleteOrder('${index}')">Delete</a>
                    </td>
                </tr>
            `;
            orderTableBody.innerHTML += row;
        });
    }

    // Function to update order status
    window.updateOrderStatus = function(index, status) {
        try {
            orders[index].status = status;
            orders[index].updatedAt = new Date();
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            showError(`Failed to update order status: ${error.message}`);
        }
    };

    // Function to delete an order
    window.deleteOrder = function(index) {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                orders.splice(index, 1);
                fetchOrders();
            } catch (error) {
                console.error('Error deleting order:', error);
                showError(`Failed to delete order: ${error.message}`);
            }
        }
    };

    // Modal controls
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.add('show');
                document.querySelector('#product-form')?.reset();
                saveProductBtn.onclick = addProduct;
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('show');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('show');
        });
    }

    // Global functions
    window.autoLogin = autoLogin;
    window.processCheckout = processCheckout;
    window.processBuyNow = processBuyNow;
    window.createOrder = createOrder;
    window.toggleUserStatus = toggleUserStatus;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
});