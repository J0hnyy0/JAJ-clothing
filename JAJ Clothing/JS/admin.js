
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

let currentEditIndex = -1;
let ordersListener = null;
let usersListener = null;
let deleteTarget = null;
let deleteType = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const authForm = document.getElementById('auth-form');
    const errorMessage = document.getElementById('errorMessage');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    // Removed addProductBtn reference
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const closeModal = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    

    // Show error messages
    function showError(message) {
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = message;
        }
    }

    // Show admin notification
    function showAdminNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '' : type === 'warning' ? '' : ''}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">x</button>
            </div>
        `;
        
        // Add to notifications container or body
        const container = document.querySelector('.notifications-container') || document.body;
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Play notification sound for new orders
    function playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Toggle views
    function showLogin() {
        loginContainer.classList.remove('hidden');
        loginContainer.classList.add('show');
        dashboardContainer.classList.remove('show');
        dashboardContainer.classList.add('hidden');
    }

    function showDashboard() {
        loginContainer.classList.remove('show');
        loginContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('show');
        updateDashboard();
        // Start listening for new orders
        startOrdersListener();
    }

    // Check authentication
    if (localStorage.getItem('isAuthenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }

    // Login handler
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('isAuthenticated', 'true');
            showDashboard();
        } else {
            showError('Incorrect username or password!');
        }
    });

    // Logout button opens modal
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('logout-modal').classList.add('show');
    });

    // Logout Yes/No actions
    document.getElementById('logout-yes').addEventListener('click', () => {
        localStorage.removeItem('isAuthenticated');
        if (ordersListener) {
            ordersListener();
        }
        if (usersListener) {
            usersListener();
        }
        document.getElementById('logout-modal').classList.remove('show');
        showLogin();
    });

    document.getElementById('logout-no').addEventListener('click', () => {
        document.getElementById('logout-modal').classList.remove('show');
    });

    // Navigation handler
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionName = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionName}-section`).classList.add('active');
            
            // Update page title with default title (count will be updated in fetch functions)
            const titles = {
                'dashboard': 'Dashboard Overview',
                'users': 'User Management',
                'products': 'Product Management',
                'orders': 'Order Management'
            };
            pageTitle.textContent = titles[sectionName];
            
            // Load section data
            if (sectionName === 'users') fetchUsers();
            if (sectionName === 'products') fetchProducts();
            if (sectionName === 'orders') fetchOrders();
        });
    });

    // Start real-time listener for orders
    function startOrdersListener() {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        
        ordersListener = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    // Only show notification for new pending orders
                    if (orderData.status === 'pending') {
                        showAdminNotification(
                            `<i class="ri-notification-3-line"></i> New order received from ${orderData.customerEmail}! Total: ₱${orderData.total.toLocaleString()}`,
                            'warning'
                        );
 
                        // Play notification sound
                        try {
                            playNotificationSound();
                        } catch (e) {
                            console.log('Could not play notification sound:', e);
                        }
                        
                        // Update dashboard if visible
                        updateDashboard();
                    }
                }
            });
            
            // Refresh orders table if on orders page
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection && activeSection.id === 'orders-section') {
                fetchOrders();
            }
        });
    }

    // Add real-time listener for users
    function startUsersListener() {
        if (usersListener) {
            usersListener(); 
        }
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        
        let isInitialLoad = true; // Flag to track initial snapshot
        
        usersListener = onSnapshot(q, (snapshot) => {
            const tbody = document.getElementById('user-table-body');
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection && activeSection.id === 'users-section') {
                snapshot.docChanges().forEach((change) => {
                    const user = { id: change.doc.id, ...change.doc.data() };
                    // Skip 'added' changes during initial load to avoid duplicates
                    if (isInitialLoad && change.type === 'added') {
                        return;
                    }
                    if (change.type === 'added' || change.type === 'modified') {
                        updateUserRow(user, change.type);
                    } else if (change.type === 'removed') {
                        const row = tbody.querySelector(`tr[data-user-id="${user.id}"]`);
                        if (row) row.remove();
                    }
                });
                // Update page title with current user count
                pageTitle.textContent = `User Management (${tbody.children.length} Users)`;
                // Mark initial load as complete after processing
                isInitialLoad = false;
            }
        }, (error) => {
            console.error('Error in users listener:', error);
            showAdminNotification('Error listening to user updates', 'error');
        });
    }

    // Update or add a single user row
    function updateUserRow(user, changeType) {
        const tbody = document.getElementById('user-table-body');
        const existingRow = tbody.querySelector(`tr[data-user-id="${user.id}"]`);
        
        let joinDate = 'N/A';
        if (user.createdAt) {
            if (user.createdAt.seconds) {
                joinDate = new Date(user.createdAt.seconds * 1000).toLocaleDateString();
            } else if (user.createdAt instanceof Date) {
                joinDate = user.createdAt.toLocaleDateString();
            } else if (typeof user.createdAt === 'string') {
                joinDate = new Date(user.createdAt).toLocaleDateString();
            }
        }
        
        let lastLogin = 'Never';
        if (user.lastLogin) {
            if (user.lastLogin.seconds) {
                lastLogin = new Date(user.lastLogin.seconds * 1000).toLocaleDateString();
            } else if (user.lastLogin instanceof Date) {
                lastLogin = user.lastLogin.toLocaleDateString();
            }
        }
        
        const userStatus = user.status || 'Active';
        const statusClass = userStatus.toLowerCase().replace(' ', '-');
        const orderCount = user.orderCount || 0;
        
        const rowHTML = `
            <tr class="user-row" data-user-id="${user.id}">
                <td>
                    <div class="user-info">
                            <div class="user-email">${user.email}</div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i class="ri-circle-fill status-indicator"></i>
                            ${userStatus}
                        </span>
                    </td>
                    <td>${joinDate}</td>
                    <td class="actions">
                        <div class="action-buttons">
                            <button class="action-btn ${userStatus === 'Active' ? 'suspend-btn' : 'activate-btn'}" 
                                    onclick="toggleUserStatus('${user.id}')" 
                                    title="${userStatus === 'Active' ? 'Suspend User' : 'Activate User'}">
                                <i class="ri-${userStatus === 'Active' ? 'user-forbid' : 'user-add'}-line"></i>
                                <span>${userStatus === 'Active' ? 'Suspend' : 'Activate'}</span>
                            </button>
                            ${userStatus !== 'Active' ? `
                            ` : ''}
                        </div>
                    </td>
                </tr>
        `;
        
        if (existingRow) {
            // Update existing row for both 'added' and 'modified' to handle any case
            existingRow.outerHTML = rowHTML;
        } else if (changeType === 'added') {
            // Only add new row if it doesn't exist
            tbody.insertAdjacentHTML('afterbegin', rowHTML);
        }
    }

    // ENHANCED FETCH USERS FUNCTION
    async function fetchUsers() {
        const tbody = document.getElementById('user-table-body');
        const loadingIndicator = document.getElementById('users-loading');
        
        // Show loading state
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        tbody.innerHTML = '<tr><td colspan="6"><div class="loading">Loading users...</div></td></tr>';
        
        try {
            // Fetch users from Firestore
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const usersSnapshot = await getDocs(q);
            
            // Clear table body
            tbody.innerHTML = '';
            
            if (usersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <i class="ri-user-line"></i>
                                <h3>No Users Found</h3>
                                <p>No registered users in the system yet.</p>
                            </div>
                        </td>
                    </tr>
                `;
                pageTitle.textContent = `User Management (0 Users)`;
                // Start listener even if empty to catch new users
                startUsersListener();
                return;
            }

            // Populate table
            usersSnapshot.forEach((doc) => {
                updateUserRow({ id: doc.id, ...doc.data() }, 'added');
            });
            
            // Update page title with count
            pageTitle.textContent = `User Management (${usersSnapshot.size} Users)`;
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Start real-time listener
            startUsersListener();
            
        } catch (error) {
            console.error('Error fetching users:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="error-state">
                            <i class="ri-error-warning-line"></i>
                            <h3>Error Loading Users</h3>
                            <p>Unable to fetch users from the database.</p>
                            <button class="retry-btn" onclick="fetchUsers()">
                                <i class="ri-refresh-line"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            showAdminNotification('Error loading users. Please try again.', 'error');
        }
    }

    // Update dashboard stats
    async function updateDashboard() {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const productsSnapshot = await getDocs(collection(db, 'products'));
            const ordersSnapshot = await getDocs(collection(db, 'orders'));
            
            const totalUsers = usersSnapshot.size;
            const totalProducts = productsSnapshot.size;
            const totalOrders = ordersSnapshot.size;
            
            let totalRevenue = 0;
            let pendingOrders = 0;
            
            ordersSnapshot.forEach(doc => {
                const orderData = doc.data();
                if (orderData.status === 'delivered' || orderData.status === 'confirmed') {
                    totalRevenue += orderData.total || 0;
                }
                if (orderData.status === 'pending') {
                    pendingOrders++;
                }
            });

            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-products').textContent = totalProducts;
            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('total-revenue').textContent = `₱${totalRevenue.toFixed(2)}`;
            
            // Update pending orders indicator
            const pendingIndicator = document.getElementById('pending-orders');
            if (pendingIndicator) {
                pendingIndicator.textContent = pendingOrders;
                if (pendingOrders > 0) {
                    pendingIndicator.classList.add('has-pending');
                } else {
                    pendingIndicator.classList.remove('has-pending');
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // Fetch products
    async function fetchProducts() {
        const tbody = document.getElementById('product-table-body');
        tbody.innerHTML = '';
        
        try {
            const productsSnapshot = await getDocs(collection(db, 'products'));
            
            // Update page title with count
            pageTitle.textContent = `Product Management (${productsSnapshot.size} Products)`;
            
            if (productsSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-box"></i>
                                <p>No products found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            productsSnapshot.forEach((doc, index) => {
                const product = { id: doc.id, ...doc.data() };
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${product.image}" alt="${product.name}" width="50" height="50"></td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>₱${product.price.toFixed(2)}</td>
                        <td class="actions">
                            <button class="action-btn" onclick="editProduct('${doc.id}', ${index})">Edit</button>
                            <button class="action-btn delete" onclick="deleteProduct('${doc.id}', ${index})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #ff6b6b;">
                        Error loading products. Please try again.
                    </td>
                </tr>
            `;
        }
    }

    // Fetch orders with enhanced display
    async function fetchOrders() {
        const tbody = document.getElementById('order-table-body');
        tbody.innerHTML = '';
        
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const ordersSnapshot = await getDocs(q);
            
            // Update page title with count
            pageTitle.textContent = `Order Management (${ordersSnapshot.size} Orders)`;
            
            if (ordersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8">
                            <div class="empty-state">
                                <i class="fas fa-shopping-cart"></i>
                                <p>No orders found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            ordersSnapshot.forEach((doc, index) => {
                const order = { id: doc.id, ...doc.data() };
                const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 
                                 order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
                const itemsDisplay = order.items.map(item => `${item.name} (${item.quantity})`).join(', ');
                
                // Highlight pending orders
                const rowClass = order.status === 'pending' ? 'pending-order pulse' : '';
                
                tbody.innerHTML += `
                    <tr class="${rowClass}">
                        <td><strong>${doc.id.substring(0, 8)}...</strong></td>
                        <td>${order.customerEmail}</td>
                        <td>
                            <div class="customer-info">
                                <div><strong>${order.customerInfo.firstName} ${order.customerInfo.lastName}</strong></div>
                                <div><small>${order.customerInfo.phone}</small></div>
                                <div><small>${order.customerInfo.address}, ${order.customerInfo.city}</small></div>
                            </div>
                        </td>
                        <td title="${itemsDisplay}">${itemsDisplay.length > 50 ? itemsDisplay.substring(0, 50) + '...' : itemsDisplay}</td>
                        <td><strong>₱${order.total.toFixed(2)}</strong></td>
                        <td>
                            <select class="status-select ${order.status}" onchange="updateOrderStatus('${doc.id}', this.value, ${index})">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>${orderDate}</td>
                        <td class="actions">
                            ${order.status === 'pending' ? 
                                `<button class="action-btn confirm-btn animate-pulse" onclick="confirmOrder('${doc.id}', ${index})">
                                    <i class="ri-notification-3-line"></i> Confirm
                                </button>` : ''
                            }
                            <button class="action-btn view-btn" onclick="viewOrderDetails('${doc.id}')">
                                <i class="ri-eye-line"></i> View
                            </button>
                            <button class="action-btn delete" onclick="deleteOrder('${doc.id}', ${index})">
                                <i class="ri-delete-bin-line"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #ff6b6b;">
                        Error loading orders. Please try again.
                    </td>
                </tr>
            `;
        }
    }

    // Modal handlers - Removed Add Product Button event listener

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            productModal.classList.remove('show');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            productModal.classList.remove('show');
        });
    }

    // Product form handler
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('category').value,
                price: parseFloat(document.getElementById('price').value),
                stock: parseInt(document.getElementById('stock').value),
                description: document.getElementById('description').value,
                image: document.getElementById('image-url').value,
                status: 'Available',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                if (currentEditIndex === -1) {
                    // Add new product
                    await addDoc(collection(db, 'products'), {
                        ...formData,
                        id: 'PROD-' + Date.now()
                    });
                    showAdminNotification('Product added successfully!', 'success');
                } else {
                    // Update existing product
                    const productRef = doc(db, 'products', currentEditIndex);
                    await updateDoc(productRef, {
                        ...formData,
                        updatedAt: new Date()
                    });
                    showAdminNotification('Product updated successfully!', 'success');
                }

                productModal.classList.remove('show');
                fetchProducts();
                updateDashboard();
            } catch (error) {
                console.error('Error saving product:', error);
                showAdminNotification('Error saving product. Please try again.', 'error');
            }
        });
    }

    // Close modal when clicking outside
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                productModal.classList.remove('show');
            }
        });
    }

    // ENHANCED TOGGLE USER STATUS FUNCTION
    window.toggleUserStatus = async function(docId) {
        try {
            const userRef = doc(db, 'users', docId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                showAdminNotification('User not found!', 'error');
                return;
            }
            
            const user = userDoc.data();
            const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
            
            // Create confirmation modal
            const confirmModal = document.createElement('div');
            confirmModal.className = 'confirm-modal show';
            confirmModal.innerHTML = `
                <div class="confirm-modal-content">
                    <h3><i class="ri-user-settings-line"></i> ${newStatus === 'Suspended' ? 'Suspend' : 'Activate'} User</h3>
                    <p>Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} user <strong>${user.email}</strong>?</p>
                    <div class="modal-actions">
                        <button id="status-confirm-yes" class="btn-yes">Yes, ${newStatus === 'Suspended' ? 'Suspend' : 'Activate'}</button>
                        <button id="status-confirm-no" class="btn-no">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);

            // Handle confirmation
            document.getElementById('status-confirm-yes').addEventListener('click', async () => {
                try {
                    await updateDoc(userRef, { 
                        status: newStatus,
                        statusUpdatedAt: new Date(),
                        updatedAt: new Date()
                    });
                    
                    showAdminNotification(
                        `<i class="ri-user-settings-line"></i> User ${newStatus.toLowerCase()} successfully!`,
                        'success'
                    );
                    // No need to call fetchUsers, listener will handle update
                    updateDashboard();
                } catch (error) {
                    console.error('Error updating user status:', error);
                    showAdminNotification('Error updating user status. Please try again.', 'error');
                }
                confirmModal.remove();
            });

            // Handle cancellation
            document.getElementById('status-confirm-no').addEventListener('click', () => {
                confirmModal.remove();
            });
            
        } catch (error) {
            console.error('Error toggling user status:', error);
            showAdminNotification('Error updating user status', 'error');
        }
    };

    // VIEW USER DETAILS FUNCTION
    window.viewUserDetails = async function(docId) {
        try {
            const userRef = doc(db, 'users', docId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                showAdminNotification('User not found!', 'error');
                return;
            }
            
            const user = userDoc.data();
            
            // Fetch user's orders
            const ordersRef = collection(db, 'orders');
            const userOrdersQuery = query(ordersRef, where('customerEmail', '==', user.email));
            const userOrdersSnapshot = await getDocs(userOrdersQuery);
            
            let totalSpent = 0;
            const orderHistory = [];
            
            userOrdersSnapshot.forEach((orderDoc) => {
                const orderData = orderDoc.data();
                totalSpent += orderData.total || 0;
                orderHistory.push({
                    id: orderDoc.id,
                    ...orderData
                });
            });
            
            // Create user details modal
            const detailsModal = document.createElement('div');
            detailsModal.className = 'user-details-modal show';
            detailsModal.innerHTML = `
                <div class="user-details-content">
                    <div class="user-details-header">
                        <h2><i class="ri-user-3-line"></i> User Details</h2>
                        <button class="close-details" onclick="this.closest('.user-details-modal').remove()">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    <div class="user-details-body">
                        <div class="user-section">
                            <h3><i class="ri-information-line"></i> Personal Information</h3>
                            <div class="user-info-grid">
                                <div><strong>Name:</strong> ${user.firstName || 'N/A'} ${user.lastName || ''}</div>
                                <div><strong>Email:</strong> ${user.email}</div>
                                <div><strong>Phone:</strong> ${user.phone || 'Not provided'}</div>
                                <div><strong>Status:</strong> <span class="status-badge ${(user.status || 'Active').toLowerCase()}">${user.status || 'Active'}</span></div>
                                <div><strong>Joined:</strong> ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                                <div><strong>Last Login:</strong> ${user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'Never'}</div>
                            </div>
                        </div>
                        
                        <div class="user-section">
                            <h3><i class="ri-shopping-cart-line"></i> Order Statistics</h3>
                            <div class="order-stats">
                                <div class="stat-card">
                                    <div class="stat-number">${userOrdersSnapshot.size}</div>
                                    <div class="stat-label">Total Orders</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-number">₱${totalSpent.toFixed(2)}</div>
                                    <div class="stat-label">Total Spent</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-number">${orderHistory.filter(o => o.status === 'delivered').length}</div>
                                    <div class="stat-label">Completed Orders</div>
                                </div>
                            </div>
                        </div>
                        
                        ${orderHistory.length > 0 ? `
                        <div class="user-section">
                            <h3><i class="ri-history-line"></i> Recent Orders</h3>
                            <div class="order-history">
                                ${orderHistory.slice(0, 5).map(order => `
                                    <div class="order-item">
                                        <div class="order-id">#${order.id.substring(0, 8)}...</div>
                                        <div class="order-date">${order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                                        <div class="order-total">₱${order.total.toFixed(2)}</div>
                                        <div class="order-status">
                                            <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(detailsModal);
            
        } catch (error) {
            console.error('Error loading user details:', error);
            showAdminNotification('Error loading user details', 'error');
        }
    };

    // DELETE USER FUNCTION (for suspended users only)
    window.deleteUser = function(docId) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal show';
        confirmModal.innerHTML = `
            <div class="confirm-modal-content">
                <h3><i class="ri-delete-bin-line"></i> Delete User</h3>
                <p>Are you sure you want to permanently delete this user? This action cannot be undone.</p>
                <div class="modal-actions">
                    <button id="delete-user-yes" class="btn-yes btn-danger">Yes, Delete</button>
                    <button id="delete-user-no" class="btn-no">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);

        document.getElementById('delete-user-yes').addEventListener('click', async () => {
            try {
                await deleteDoc(doc(db, 'users', docId));
                showAdminNotification('User deleted successfully!', 'success');
                // No need to call fetchUsers, listener will handle removal
                updateDashboard();
            } catch (error) {
                console.error('Error deleting user:', error);
                showAdminNotification('Error deleting user', 'error');
            }
            confirmModal.remove();
        });

        document.getElementById('delete-user-no').addEventListener('click', () => {
            confirmModal.remove();
        });
    };

    window.editProduct = async function(docId, index) {
        try {
            currentEditIndex = docId;
            const productRef = doc(db, 'products', docId);
            const productDoc = await getDoc(productRef);
            const product = productDoc.data();
            
            document.getElementById('modal-title').textContent = 'Edit Product';
            document.getElementById('product-name').value = product.name;
            document.getElementById('category').value = product.category;
            document.getElementById('price').value = product.price;
            document.getElementById('stock').value = product.stock;
            document.getElementById('description').value = product.description;
            document.getElementById('image-url').value = product.image;
            
            productModal.classList.add('show');
        } catch (error) {
            console.error('Error loading product for edit:', error);
            showAdminNotification('Error loading product data', 'error');
        }
    };

    window.deleteProduct = function(docId, index) {
        openDeleteModal('product', docId, index);
    };

    window.deleteOrder = function(docId, index) {
        openDeleteModal('order', docId, index);
    };

    // Open delete modal
    function openDeleteModal(type, docId, index) {
        deleteTarget = { type, docId, index };
        deleteType = type;

        // Customize message
        const msg = type === 'product'
            ? "Are you sure you want to delete this product?"
            : "Are you sure you want to delete this order?";

        document.getElementById('delete-message').textContent = msg;
        document.getElementById('delete-modal').classList.add('show');
    }

    // Delete Yes
    document.getElementById('delete-yes').addEventListener('click', async () => {
        if (!deleteTarget) return;

        try {
            if (deleteType === 'product') {
                await deleteDoc(doc(db, 'products', deleteTarget.docId));
                showAdminNotification('🗑 Product deleted successfully!', 'success');
                fetchProducts();
                updateDashboard();
            } else if (deleteType === 'order') {
                await deleteDoc(doc(db, 'orders', deleteTarget.docId));
                showAdminNotification('🗑 Order deleted successfully!', 'success');
                fetchOrders();
                updateDashboard();
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showAdminNotification('❌ Error deleting item', 'error');
        }

        document.getElementById('delete-modal').classList.remove('show');
        deleteTarget = null;
    });

    // Delete No
    document.getElementById('delete-no').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.remove('show');
        deleteTarget = null;
    });

    // ENHANCED CONFIRM ORDER FUNCTION
    window.confirmOrder = async function(docId, index) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'confirm-modal show';
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <p>Are you sure you want to confirm this order?</p>
                <div class="modal-actions">
                    <button id="confirm-yes" class="btn-yes">Yes</button>
                    <button id="confirm-no" class="btn-no">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Handle Yes
        document.getElementById('confirm-yes').addEventListener('click', async () => {
            try {
                const orderRef = doc(db, 'orders', docId);
                await updateDoc(orderRef, {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                    updatedAt: new Date()
                });

                showAdminNotification('✅ Order confirmed successfully! Customer can now see it in their order history.', 'success');
                fetchOrders();
                updateDashboard();
            } catch (error) {
                console.error('Error confirming order:', error);
                showAdminNotification('❌ Error confirming order. Please try again.', 'error');
            }
            modal.remove();
        });

        // Handle No
        document.getElementById('confirm-no').addEventListener('click', () => {
            modal.remove();
        });

        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };

    window.updateOrderStatus = async function(docId, status, index) {
        try {
            const orderRef = doc(db, 'orders', docId);
            const updateData = {
                status: status,
                updatedAt: new Date()
            };
            
            // Add timestamp for specific statuses
            if (status === 'confirmed') {
                updateData.confirmedAt = new Date();
            } else if (status === 'processing') {
                updateData.processingAt = new Date();
            } else if (status === 'shipped') {
                updateData.shippedAt = new Date();
            } else if (status === 'delivered') {
                updateData.deliveredAt = new Date();
            } else if (status === 'cancelled') {
                updateData.cancelledAt = new Date();
            }
            
            await updateDoc(orderRef, updateData);
            showAdminNotification(
                `<i class="ri-file-list-3-line"></i> Order status updated to ${status.toUpperCase()}`,
                'success'
            );
            fetchOrders();
            updateDashboard();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            showAdminNotification('Error updating order status', 'error');
        }
    };

    // View order details function - ENHANCED
    window.viewOrderDetails = async function(docId) {
        try {
            const orderRef = doc(db, 'orders', docId);
            const orderDoc = await getDoc(orderRef);
            const order = orderDoc.data();
            
            // Create and show order details modal
            const detailsModal = document.createElement('div');
            detailsModal.className = 'order-details-modal show';
            detailsModal.innerHTML = `
            <div class="order-details-content">
                <div class="order-details-header">
                    <h2><i class="ri-file-list-3-line"></i> Order Details - ${docId.substring(0, 8)}...</h2>
                    <button class="close-details" onclick="this.closest('.order-details-modal').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="order-details-body">
                    <div class="order-section">
                        <h3><i class="ri-user-3-line"></i> Customer Information</h3>
                        <p><strong>Name:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName}</p>
                        <p><strong>Email:</strong> ${order.customerInfo.email}</p>
                        <p><strong>Phone:</strong> ${order.customerInfo.phone}</p>
                        <p><strong>Address:</strong> ${order.customerInfo.address}, ${order.customerInfo.city}, ${order.customerInfo.province} ${order.customerInfo.zipCode}</p>
                    </div>
                    <div class="order-section">
                        <h3><i class="ri-shopping-bag-3-line"></i> Order Items</h3>
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <img src="${item.image}" alt="${item.name}" width="50" height="50">
                                    <div class="item-details">
                                        <div><strong>${item.name}</strong></div>
                                        <div>Color: ${item.color}, Size: ${item.size}</div>
                                        <div>Quantity: ${item.quantity} × ₱${item.price} = ₱${(item.quantity * item.price).toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="order-section">
                        <h3><i class="ri-wallet-3-line"></i> Order Summary</h3>
                        <p><strong>Subtotal:</strong> ₱${order.subtotal.toFixed(2)}</p>
                        <p><strong>Shipping:</strong> ₱${order.shipping.toFixed(2)}</p>
                        <p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></p>
                        <p><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleString() : order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                    </div>
                </div>
                <div class="order-details-footer">
                    ${order.status === 'pending' ? 
                        `<button class="action-btn confirm-btn" onclick="confirmOrderFromModal('${docId}')">
                            <i class="ri-check-double-line"></i> Confirm Order
                        </button>` : ''
                    }
                </div>
            </div>
            `;
            
            document.body.appendChild(detailsModal);
        } catch (error) {
            console.error('Error loading order details:', error);
            showAdminNotification('Error loading order details', 'error');
        }
    };

    // Confirm order from modal
    window.confirmOrderFromModal = async function(docId) {
        await window.confirmOrder(docId);
        const modal = document.querySelector('.order-details-modal');
        if (modal) {
            modal.remove();
        }
    };

    // Close with animation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-details')) {
            const modal = e.target.closest('.order-details-modal');
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 300); // Wait for animation to complete
        }
    });
    
    // Initialize dashboard
    updateDashboard();
});