import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Firebase configuration
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
let ridersListener = null;
let deleteTarget = null;
let deleteType = null;

// Add this function in admin.js (once, anywhere in the file)
function getStatusClass(status) {
    const statusClasses = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending'; // fallback
}

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const authForm = document.getElementById('auth-form');
    const errorMessage = document.getElementById('errorMessage');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
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
                <span class="notification-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        const container = document.querySelector('.notifications-container') || document.body;
        container.appendChild(notification);
        
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
        if (ordersListener) ordersListener();
        if (usersListener) usersListener();
        if (ridersListener) ridersListener();
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
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionName}-section`).classList.add('active');
            
            const titles = {
                'dashboard': 'Dashboard Overview',
                'users': 'User Management',
                'products': 'Product Management',
                'orders': 'Order Management',
                'riders': 'Rider Management'
            };
            pageTitle.textContent = titles[sectionName];
            
            if (sectionName === 'users') fetchUsers();
            if (sectionName === 'products') fetchProducts();
            if (sectionName === 'orders') fetchOrders();
            if (sectionName === 'riders') fetchRiders();
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
                    if (orderData.status === 'pending') {
                        showAdminNotification(
                            `New order received from ${orderData.customerEmail}! Total: ₱${orderData.total.toLocaleString()}`,
                            'warning'
                        );
 
                        try {
                            playNotificationSound();
                        } catch (e) {
                            console.log('Could not play notification sound:', e);
                        }
                        
                        updateDashboard();
                    }
                }
            });
            
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection && activeSection.id === 'orders-section') {
                fetchOrders();
            }
        });
    }

    // Fetch riders
    async function fetchRiders() {
        const tbody = document.getElementById('rider-table-body');
        tbody.innerHTML = '<tr><td colspan="6"><div class="loading">Loading riders...</div></td></tr>';
        
        try {
            const ridersRef = collection(db, 'riders');
            const q = query(ridersRef, orderBy('createdAt', 'desc'));
            const ridersSnapshot = await getDocs(q);
            
            tbody.innerHTML = '';
            
            if (ridersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <i class="fas fa-motorcycle"></i>
                                <p>No riders found</p>
                            </div>
                        </td>
                    </tr>
                `;
                pageTitle.textContent = 'Rider Management (0 Riders)';
                return;
            }

            // Get active deliveries count for each rider
            const ordersSnapshot = await getDocs(collection(db, 'orders'));
            const activeDeliveries = {};
            
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.assignedRider && order.status !== 'delivered' && order.status !== 'cancelled') {
                    activeDeliveries[order.assignedRider] = (activeDeliveries[order.assignedRider] || 0) + 1;
                }
            });

            ridersSnapshot.forEach(doc => {
                const rider = { id: doc.id, ...doc.data() };
                const deliveryCount = activeDeliveries[doc.id] || 0;
                
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${rider.name}</strong></td>
                        <td>${rider.email}</td>
                        <td>${rider.phone}</td>
                        <td>${rider.vehicle || 'N/A'}</td>
                        <td><span class="badge">${deliveryCount}</span></td>
                        <td>
                            <span class="status-badge ${rider.status === 'active' ? 'active' : 'inactive'}">
                                ${rider.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            pageTitle.textContent = `Rider Management (${ridersSnapshot.size} Riders)`;
            
        } catch (error) {
            console.error('Error fetching riders:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ff6b6b;">
                        Error loading riders. Please try again.
                    </td>
                </tr>
            `;
        }
    }

    // Add real-time listener for users
    function startUsersListener() {
        if (usersListener) usersListener();
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        
        let isInitialLoad = true;
        
        usersListener = onSnapshot(q, (snapshot) => {
            const tbody = document.getElementById('user-table-body');
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection && activeSection.id === 'users-section') {
                snapshot.docChanges().forEach((change) => {
                    const user = { id: change.doc.id, ...change.doc.data() };
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
                pageTitle.textContent = `User Management (${tbody.children.length} Users)`;
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
        
        const userStatus = user.status || 'Active';
        const statusClass = userStatus.toLowerCase().replace(' ', '-');
        
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
                    </div>
                </td>
            </tr>
        `;
        
        if (existingRow) {
            existingRow.outerHTML = rowHTML;
        } else if (changeType === 'added') {
            tbody.insertAdjacentHTML('afterbegin', rowHTML);
        }
    }

    // Fetch users
    async function fetchUsers() {
        const tbody = document.getElementById('user-table-body');
        const loadingIndicator = document.getElementById('users-loading');
        
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        tbody.innerHTML = '<tr><td colspan="6"><div class="loading">Loading users...</div></td></tr>';
        
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const usersSnapshot = await getDocs(q);
            
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
                pageTitle.textContent = 'User Management (0 Users)';
                startUsersListener();
                return;
            }

            usersSnapshot.forEach((doc) => {
                updateUserRow({ id: doc.id, ...doc.data() }, 'added');
            });
            
            pageTitle.textContent = `User Management (${usersSnapshot.size} Users)`;
            
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            startUsersListener();
            
        } catch (error) {
            console.error('Error fetching users:', error);
            
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
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
            
            // Get riders for dropdown
            const ridersSnapshot = await getDocs(collection(db, 'riders'));
            const riders = [];
            ridersSnapshot.forEach(doc => {
                riders.push({ id: doc.id, ...doc.data() });
            });
            
            pageTitle.textContent = `Order Management (${ordersSnapshot.size} Orders)`;
            
            if (ordersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9">
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
                
                const rowClass = order.status === 'pending' ? 'pending-order pulse' : '';
                
                // Rider assignment display
                let riderDisplay = '';
                if (order.assignedRider) {
                    const assignedRider = riders.find(r => r.id === order.assignedRider);
                    riderDisplay = assignedRider ? 
                        `<div class="rider-name">${assignedRider.name}</div>` :
                        '<div class="rider-name text-muted">Rider not found</div>';
                } else {
                    riderDisplay = `<button class="assign-rider-btn" onclick="openAssignRiderModal('${doc.id}')">
                        <i class="fas fa-plus"></i> Assign Rider
                    </button>`;
                }
                
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
                        <td>
                            <div class="rider-assignment">
                                ${riderDisplay}
                            </div>
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
                    <td colspan="9" style="text-align: center; color: #ff6b6b;">
                        Error loading orders. Please try again.
                    </td>
                </tr>
            `;
        }
    }

    // Assign Rider Modal
    window.openAssignRiderModal = async function(orderId) {
        try {
            const ridersSnapshot = await getDocs(collection(db, 'riders'));
            
            if (ridersSnapshot.empty) {
                alert('No riders available. Please add riders first.');
                return;
            }
            
            const modal = document.createElement('div');
            modal.className = 'assign-rider-modal show';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-motorcycle"></i> Assign Rider</h2>
                        <button class="close-modal" onclick="this.closest('.assign-rider-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Order ID: <strong>${orderId.substring(0, 8)}...</strong></p>
                        <div class="form-group">
                            <label>Select Rider:</label>
                            <select id="riderSelect" class="rider-select">
                                <option value="">-- Choose a rider --</option>
                                ${Array.from(ridersSnapshot.docs).map(doc => {
                                    const rider = doc.data();
                                    return `<option value="${doc.id}">${rider.name} (${rider.vehicle || 'N/A'})</option>`;
                                }).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="this.closest('.assign-rider-modal').remove()">Cancel</button>
                        <button class="btn-assign" onclick="assignRiderToOrder('${orderId}')">Assign</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error opening assign rider modal:', error);
            alert('Error loading riders. Please try again.');
        }
    };

    window.assignRiderToOrder = async function(orderId) {
        const riderSelect = document.getElementById('riderSelect');
        const riderId = riderSelect.value;
        
        if (!riderId) {
            alert('Please select a rider!');
            return;
        }
        
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                assignedRider: riderId,
                updatedAt: new Date()
            });
            
            showAdminNotification('Rider assigned successfully!', 'success');
            document.querySelector('.assign-rider-modal').remove();
            fetchOrders();
        } catch (error) {
            console.error('Error assigning rider:', error);
            alert('Failed to assign rider. Please try again.');
        }
    };

    // Modal handlers
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
                description: document.getElementById('description').value,
                image: document.getElementById('image-url').value,
                status: 'Available',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                if (currentEditIndex === -1) {
                    await addDoc(collection(db, 'products'), {
                        ...formData,
                        id: 'PROD-' + Date.now()
                    });
                    showAdminNotification('Product added successfully!', 'success');
                } else {
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

    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                productModal.classList.remove('show');
            }
        });
    }

    // Toggle user status
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

            document.getElementById('status-confirm-yes').addEventListener('click', async () => {
                try {
                    await updateDoc(userRef, { 
                        status: newStatus,
                        statusUpdatedAt: new Date(),
                        updatedAt: new Date()
                    });
                    
                    showAdminNotification(
                        `User ${newStatus.toLowerCase()} successfully!`,
                        'success'
                    );
                    updateDashboard();
                } catch (error) {
                    console.error('Error updating user status:', error);
                    showAdminNotification('Error updating user status. Please try again.', 'error');
                }
                confirmModal.remove();
            });

            document.getElementById('status-confirm-no').addEventListener('click', () => {
                confirmModal.remove();
            });
            
        } catch (error) {
            console.error('Error toggling user status:', error);
            showAdminNotification('Error updating user status', 'error');
        }
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

    function openDeleteModal(type, docId, index) {
        deleteTarget = { type, docId, index };
        deleteType = type;

        const msg = type === 'product'
            ? "Are you sure you want to delete this product?"
            : "Are you sure you want to delete this order?";

        document.getElementById('delete-message').textContent = msg;
        document.getElementById('delete-modal').classList.add('show');
    }

    document.getElementById('delete-yes').addEventListener('click', async () => {
        if (!deleteTarget) return;

        try {
            if (deleteType === 'product') {
                await deleteDoc(doc(db, 'products', deleteTarget.docId));
                showAdminNotification('Product deleted successfully!', 'success');
                fetchProducts();
                updateDashboard();
            } else if (deleteType === 'order') {
                await deleteDoc(doc(db, 'orders', deleteTarget.docId));
                showAdminNotification('Order deleted successfully!', 'success');
                fetchOrders();
                updateDashboard();
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showAdminNotification('Error deleting item', 'error');
        }

        document.getElementById('delete-modal').classList.remove('show');
        deleteTarget = null;
    });

    document.getElementById('delete-no').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.remove('show');
        deleteTarget = null;
    });

    window.confirmOrder = async function(docId, index) {
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

        document.getElementById('confirm-yes').addEventListener('click', async () => {
            try {
                const orderRef = doc(db, 'orders', docId);
                await updateDoc(orderRef, {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                    updatedAt: new Date()
                });

                showAdminNotification('Order confirmed successfully! Customer can now see it in their order history.', 'success');
                fetchOrders();
                updateDashboard();
            } catch (error) {
                console.error('Error confirming order:', error);
                showAdminNotification('Error confirming order. Please try again.', 'error');
            }
            modal.remove();
        });

        document.getElementById('confirm-no').addEventListener('click', () => {
            modal.remove();
        });

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
                `Order status updated to ${status.toUpperCase()}`,
                'success'
            );
            fetchOrders();
            updateDashboard();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            showAdminNotification('Error updating order status', 'error');
        }
    };


window.viewOrderDetails = async function(docId) {
    try {
        const orderRef = doc(db, 'orders', docId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
            showAdminNotification('Order not found', 'error');
            return;
        }
        
        const order = orderDoc.data();
        
        // Safely access nested properties with fallbacks
        const customerInfo = order.customerInfo || {};
        const firstName = customerInfo.firstName || 'N/A';
        const lastName = customerInfo.lastName || '';
        const email = customerInfo.email || 'N/A';
        const phone = customerInfo.phone || 'N/A';
        const address = customerInfo.address || 'N/A';
        const city = customerInfo.city || 'N/A';
        const province = customerInfo.province || 'N/A';
        const zipCode = customerInfo.zipCode || '';
        
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
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Address:</strong> ${address}, ${city}, ${province} ${zipCode}</p>
                </div>
                <div class="order-section">
                    <h3><i class="ri-shopping-bag-3-line"></i> Order Items</h3>
                    <div class="order-items">
                        ${(order.items || []).map(item => `
                            <div class="order-item">
                                <img src="${item.image || ''}" alt="${item.name || 'Product'}" width="50" height="50">
                                <div class="item-details">
                                    <div><strong>${item.name || 'N/A'}</strong></div>
                                    <div>Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}</div>
                                    <div>Quantity: ${item.quantity || 0} × ₱${item.price || 0} = ₱${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="order-section">
                    <h3><i class="ri-wallet-3-line"></i> Order Summary</h3>
                    <p><strong>Subtotal:</strong> ₱${(order.subtotal || 0).toFixed(2)}</p>
                    <p><strong>Shipping:</strong> ₱${(order.shipping || order.shippingFee || 0).toFixed(2)}</p>
                    <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status || 'pending'}">${(order.status || 'PENDING').toUpperCase()}</span></p>
                    <p><strong>Order Date:</strong> ${order.orderDate && order.orderDate.seconds ? new Date(order.orderDate.seconds * 1000).toLocaleString() : order.createdAt && order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                </div>
            </div>
            <div class="order-details-footer">
                ${order.status === 'pending' ? 
                    `<button class="action-btn confirm-btn" onclick="confirmOrderFromModal('${docId}')">
                        <i class="ri-check-double-line"></i> Confirm Order
                    </button>` : ''
                }
                <button class="action-btn print-btn" onclick="printReceipt('${docId}')"> <!-- NEW: Print Button -->
                    <i class="ri-printer-line"></i> Print Receipt
                </button>
            </div>
        </div>
        `;
        
        document.body.appendChild(detailsModal);
    } catch (error) {
        console.error('Error loading order details:', error);
        showAdminNotification('Error loading order details', 'error');
    }
};

window.printReceipt = async function(orderId) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) {
            showAdminNotification('Order not found for printing', 'error');
            return;
        }
        
        const order = orderDoc.data();
        const orderDocId = orderDoc.id;
        const orderDate = order.orderDate && order.orderDate.seconds 
            ? new Date(order.orderDate.seconds * 1000).toLocaleDateString()
            : order.createdAt && order.createdAt.seconds 
            ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
            : 'N/A';
        
        const statusClass = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        }[order.status] || 'status-pending';
        
        const printWindow = window.open('', '_blank');
        const receiptHTML = `
        <html>
        <head>
            <title>Order Receipt - ${orderDocId}</title>
            <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 30px;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .receipt-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .receipt-header p {
          margin: 5px 0;
          color: #666;
        }
        
        .receipt-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 30px;
          text-transform: uppercase;
        }
        
        .info-section {
          margin-bottom: 30px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        
        .info-label {
          font-weight: bold;
          color: #666;
        }
        
        .info-value {
          text-align: right;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #000;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          border: 1px solid #ddd;
          font-weight: bold;
        }
        
        .items-table td {
          padding: 12px;
          border: 1px solid #ddd;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .summary-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #000;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 16px;
        }
        
        .summary-row.total {
          font-size: 20px;
          font-weight: bold;
          padding-top: 15px;
          border-top: 2px solid #000;
          margin-top: 10px;
        }
        
        .shipping-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .shipping-info p {
          margin: 5px 0;
        }
        
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
        .status-processing { background-color: #cce5ff; color: #004085; }
        .status-shipped { background-color: #d4edda; color: #155724; }
        .status-delivered { background-color: #d4edda; color: #155724; }
        
        .receipt-footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 2px solid #000;
          color: #666;
          font-size: 14px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .receipt-container {
            border: none;
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <h1>JAJ CLOTHING</h1>
          <p>742 Evergreen Terrace, Springfield</p>
          <p>Phone: +63962 461 7897</p>
          <p>Email: 123johnjose@gmail.com</p>
        </div>
        
        <div class="receipt-title">ORDER RECEIPT</div>
        
        <div class="info-section">
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${orderDocId}</span> <!-- FIXED: Now shows real ID -->
              </div>
              <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${orderDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                  <span class="status-badge ${statusClass}">${(order.status || 'pending').toUpperCase()}</span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}</span>
              </div>
            </div>
        
        <div class="section-title">SHIPPING INFORMATION</div>
        <div class="shipping-info">
          <p><strong>${order.customerInfo?.firstName || 'N/A'} ${order.customerInfo?.lastName || ''}</strong></p>
          <p>${order.customerInfo?.phone || 'N/A'}</p>
          <p>${order.customerInfo?.address || 'N/A'}</p>
          <p>${order.customerInfo?.city || 'N/A'}, ${order.customerInfo?.province || 'N/A'} ${order.customerInfo?.zipCode || ''}</p>
        </div>
        
        <div class="section-title">ORDER ITEMS</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-center">Color</th>
              <th class="text-center">Size</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.color}</td>
                <td class="text-center">${item.size}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₱${item.price.toFixed(2)}</td>
                <td class="text-right">₱${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₱${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Shipping Fee:</span>
            <span>${(order.shippingFee || order.shipping || 0) === 0 ? 'FREE' : '₱' + (order.shippingFee || order.shipping || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row total">
            <span>TOTAL:</span>
            <span>₱${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="receipt-footer">
          <p>Thank you for shopping with JAJ Clothing!</p>
          <p>For inquiries, please contact us at 123johnjose@gmail.com or +63962 461 7897</p>
          <p style="margin-top: 15px; font-size: 12px;">This is a computer-generated receipt. Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
        `;
        
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing receipt:', error);
        showAdminNotification('Error generating receipt', 'error');
    }
};

// ... (rest of admin.js remains the same)
    window.confirmOrderFromModal = async function(docId) {
        await window.confirmOrder(docId);
        const modal = document.querySelector('.order-details-modal');
        if (modal) {
            modal.remove();
        }
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-details')) {
            const modal = e.target.closest('.order-details-modal');
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    updateDashboard();
});