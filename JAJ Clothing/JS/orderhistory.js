// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Global variable to store current user
let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    console.log('User authenticated:', user.uid);
    loadUserOrders(user.uid);
  } else {
    console.log('No authenticated user');
    loadGuestOrders();
  }
});

// Load orders for authenticated user
function loadUserOrders(userId) {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef, 
    where("userId", "==", userId),
    where("status", "in", ["pending", "confirmed", "processing", "shipped", "delivered"]) 
  );
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(q, snapshot => {
    console.log('Orders snapshot received:', snapshot.size, 'orders');
    displayOrders(snapshot);
  }, error => {
    console.error("Error loading user orders:", error);
    showErrorState("Error loading your orders. Please try refreshing the page.");
  });
  
  // Store unsubscribe function to clean up later
  window.ordersUnsubscribe = unsubscribe;
}

// Display orders in the table
function displayOrders(snapshot) {
  let tbody = document.getElementById("orderTableBody");
  tbody.innerHTML = "";

  if (snapshot.empty) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 40px; color:#999;">
          <div class="empty-state">
            <div class="empty-icon">
              <i class="ri-shopping-bag-3-line" style="font-size: 48px; color: #ccc;"></i>
            </div>
            <h3>No orders yet</h3>
            <p>Your orders will appear here after you place them.</p>
            <a href="Collection.html" class="btn-primary" style="margin-top: 16px; display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; background: #4caf50; color: white;">Start Shopping</a>
          </div>
        </td>
      </tr>
    `;
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = 'Order History (0 Orders)';
    }
    return;
  }

  // Sort orders by status priority and date (pending first, then by date)
  const ordersArray = [];
  snapshot.forEach(doc => {
    ordersArray.push({ id: doc.id, ...doc.data() });
  });

  // Sort: pending orders first, then by creation date (newest first)
  ordersArray.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    
    // If both same status priority, sort by date
    const aTime = a.createdAt?.seconds || a.orderDate?.seconds || 0;
    const bTime = b.createdAt?.seconds || b.orderDate?.seconds || 0;
    return bTime - aTime;
  });

  // Display each order
  ordersArray.forEach(order => {
    let orderDate = getFormattedDate(order);
    let itemsDisplay = order.items.map(item => `${item.name} (${item.quantity})`).join(', ');
    let statusClass = getStatusClass(order.status);
    let statusIcon = getStatusIcon(order.status);
    
    // Add special styling for pending orders
    let rowClass = order.status === 'pending' ? 'pending-order-row' : 'order-row';
    
    let row = `
      <tr class="${rowClass}">
        <td><strong>#${order.id.substring(0, 8)}...</strong></td>
        <td>${orderDate}</td>
        <td>
          <div class="items-preview" title="${itemsDisplay}">
            ${itemsDisplay.length > 50 ? itemsDisplay.substring(0, 50) + '...' : itemsDisplay}
          </div>
        </td>
        <td><strong>₱${order.total.toLocaleString()}</strong></td>
        <td>
          <span class="order-status ${statusClass}">
            ${statusIcon} ${order.status.toUpperCase()}
            ${order.status === 'pending' ? '<div class="pending-note"></div>' : ''}
          </span>
        </td>
        <td>
          <button class="btn-details" onclick="event.stopPropagation(); showOrderDetails('${order.id}')">
            <i class="ri-eye-line"></i> Details
          </button>
        </td>
      </tr>
      <tr class="order-details-row" id="details-${order.id}" style="display: none;">
        <td colspan="6">
          <div class="order-details-container">
            <div class="order-info-grid">
              <div class="customer-section">
                <h4><i class="ri-file-list-3-line"></i> Order Information</h4>
                <div class="info-row">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${order.id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${orderDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value">
                    <span class="order-status ${statusClass}">
                      ${statusIcon} ${order.status.toUpperCase()}
                    </span>
                    ${order.status === 'pending' ? `
                      <div class="status-explanation">
                        <small>Your order is being reviewed by our team. You'll be notified once it's confirmed.</small>
                      </div>
                    ` : ''}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${order.paymentMethod.toUpperCase()}</span>
                </div>
              </div>
              
              <div class="shipping-section">
                <h4><i class="ri-truck-line"></i> Shipping Information</h4>
                <div class="shipping-address">
                  <div><strong>${order.customerInfo.firstName} ${order.customerInfo.lastName}</strong></div>
                  <div>${order.customerInfo.phone}</div>
                  <div>${order.customerInfo.address}</div>
                  <div>${order.customerInfo.city}, ${order.customerInfo.province} ${order.customerInfo.zipCode}</div>
                </div>
              </div>
            </div>
            
            <div class="order-summary-section">
              <h4><i class="ri-wallet-3-line"></i> Order Summary</h4>
              <div class="summary-line">
                <span>Subtotal:</span>
                <span>₱${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-line">
                <span>Shipping:</span>
                <span>${order.shipping === 0 ? 'FREE' : '₱' + order.shipping.toFixed(2)}</span>
              </div>
              <div class="summary-line total-line">
                <span><strong>Total:</strong></span>
                <span><strong>₱${order.total.toFixed(2)}</strong></span>
              </div>
            </div>
            
            <div class="items-section">
              <h4><i class="ri-shopping-bag-3-line"></i> Order Items (${order.items.length} items)</h4>
              <div class="items-grid">
                ${order.items.map(item => `
                  <div class="item-card">
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-info">
                      <div class="item-name">${item.name}</div>
                      <div class="item-details">
                        <span class="item-variant">Color: ${item.color}</span>
                        <span class="item-variant">Size: ${item.size}</span>
                      </div>
                      <div class="item-quantity">Quantity: ${item.quantity}</div>
                      <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="order-timeline">
              <h4><i class="ri-time-line"></i> Order Timeline</h4>
              <div class="timeline">
                <div class="timeline-item ${['pending'].includes(order.status) ? 'current' : order.status === 'confirmed' || ['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}">
                  <div class="timeline-marker">
                    <i class="${order.status === 'pending' ? 'ri-time-line' : 'ri-check-double-line'}"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-title">${order.status === 'pending' ? 'Order Submitted' : 'Order Confirmed'}</div>
                    <div class="timeline-date">
                      ${order.status === 'pending' ? 
                        (order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Submitted') :
                        (order.confirmedAt ? new Date(order.confirmedAt.seconds * 1000).toLocaleString() : 'Confirmed')
                      }
                    </div>
                  </div>
                </div>
                <div class="timeline-item ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}">
                  <div class="timeline-marker"><i class="ri-settings-3-line"></i></div>
                  <div class="timeline-content">
                    <div class="timeline-title">Processing</div>
                    <div class="timeline-date">${order.status === 'processing' || ['shipped', 'delivered'].includes(order.status) ? 'In progress' : 'Pending confirmation'}</div>
                  </div>
                </div>
                <div class="timeline-item ${['shipped', 'delivered'].includes(order.status) ? 'completed' : ''}">
                  <div class="timeline-marker"><i class="ri-truck-line"></i></div>
                  <div class="timeline-content">
                    <div class="timeline-title">Shipped</div>
                    <div class="timeline-date">${order.shippedAt ? new Date(order.shippedAt.seconds * 1000).toLocaleString() : order.status === 'shipped' ? 'In transit' : 'Pending'}</div>
                  </div>
                </div>
                <div class="timeline-item ${order.status === 'delivered' ? 'completed' : ''}">
                  <div class="timeline-marker"><i class="ri-box-3-line"></i></div>
                  <div class="timeline-content">
                    <div class="timeline-title">Delivered</div>
                    <div class="timeline-date">${order.deliveredAt ? new Date(order.deliveredAt.seconds * 1000).toLocaleString() : order.status === 'delivered' ? 'Completed' : 'Pending'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            ${order.status === 'pending' ? `
              <div class="pending-order-notice">
                <div class="notice-content">
                  <i class="ri-information-line"></i>
                  <div>
                    <h5>Order Under Review</h5>
                    <p>Your order is currently being reviewed by our team. This typically takes 1-2 business days. You'll receive an email notification once your order is confirmed and processing begins.</p>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
  
  // Update page title with order count
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    const pendingCount = ordersArray.filter(order => order.status === 'pending').length;
    const totalCount = ordersArray.length;
    const titleText = pendingCount > 0 ? 
      `Order History (${totalCount} Orders - ${pendingCount} Pending)` : 
      `Order History (${totalCount} Orders)`;
    pageTitle.textContent = titleText;
  }
}

// Get formatted date from order
function getFormattedDate(order) {
  if (order.orderDate && order.orderDate.seconds) {
    return new Date(order.orderDate.seconds * 1000).toLocaleDateString();
  } else if (order.createdAt && order.createdAt.seconds) {
    return new Date(order.createdAt.seconds * 1000).toLocaleDateString();
  } else if (order.confirmedAt && order.confirmedAt.seconds) {
    return new Date(order.confirmedAt.seconds * 1000).toLocaleDateString();
  }
  return 'N/A';
}

// Load guest orders (when user is not authenticated)
function loadGuestOrders() {
  let tbody = document.getElementById("orderTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; padding: 40px; color:#999;">
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>Please log in to view your orders</h3>
          <p>Sign in to your account to see your order history and track your purchases.</p>
          <p><small>All your orders (including pending ones) will be displayed here once you're logged in.</small></p>
          <a href="login.html" class="btn-primary" style="margin-top: 16px; display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; background: #007bff; color: white;">Sign In</a>
        </div>
      </td>
    </tr>
  `;
  
  // Update page title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = 'Order History - Please Log In';
  }
}

// Show error state
function showErrorState(message) {
  let tbody = document.getElementById("orderTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; color:#ff6b6b; padding: 40px;">
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error loading orders</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="btn-primary" style="margin-top: 16px; padding: 12px 24px; border: none; border-radius: 6px; background: #007bff; color: white; cursor: pointer;">Refresh Page</button>
        </div>
      </td>
    </tr>
  `;
}

// Helper function to get status class for styling
function getStatusClass(status) {
  const statusClasses = {
    'pending': 'status-pending',
    'confirmed': 'status-confirmed',
    'processing': 'status-processing',
    'shipped': 'status-shipped',
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  return statusClasses[status] || 'status-default';
}

// Helper function to get status icon
function getStatusIcon(status) {
  const statusIcons = {
    'pending': '<i class="ri-time-line"></i>',          
    'confirmed': '<i class="ri-check-double-line"></i>', 
    'processing': '<i class="ri-settings-3-line"></i>',  
    'shipped': '<i class="ri-truck-line"></i>',          
    'delivered': '<i class="ri-box-3-line"></i>',        
    'cancelled': '<i class="ri-close-circle-line"></i>'  
  };
  return statusIcons[status] || '<i class="ri-question-line"></i>';
}

// Toggle order details visibility
function toggleOrderDetails(orderId) {
  const detailsRow = document.getElementById(`details-${orderId}`);
  if (detailsRow) {
    const isVisible = detailsRow.style.display !== 'none';
    
    // Hide all other detail rows first
    document.querySelectorAll('.order-details-row').forEach(row => {
      row.style.display = 'none';
    });
    
    // Toggle current row
    detailsRow.style.display = isVisible ? 'none' : 'table-row';
    
    // Scroll to the details if opening
    if (!isVisible) {
      setTimeout(() => {
        detailsRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }
}

// Show order details in modal (alternative implementation)
function showOrderDetails(orderId) {
  const detailsRow = document.getElementById(`details-${orderId}`);
  if (!detailsRow) return;

  // Grab the inner HTML of the hidden details
  const detailsContent = detailsRow.querySelector(".order-details-container").outerHTML;

  // Inject into modal
  document.getElementById("orderDetailsContent").innerHTML = detailsContent;

  // Show modal
  document.getElementById("orderDetailsModal").style.display = "block";
}

// Close modal
function closeOrderModal() {
  document.getElementById("orderDetailsModal").style.display = "none";
}

// Close on outside click
window.onclick = function(event) {
  const modal = document.getElementById("orderDetailsModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

window.showOrderDetails = showOrderDetails;
window.closeOrderModal = closeOrderModal;

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `order-notification order-notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// Clean up listeners when page unloads
window.addEventListener('beforeunload', () => {
  if (window.ordersUnsubscribe) {
    window.ordersUnsubscribe();
  }
});

// Make functions globally available
window.toggleOrderDetails = toggleOrderDetails;
window.showOrderDetails = showOrderDetails;
window.showNotification = showNotification;

// Logout functions
function showLogoutPopup() {
  document.getElementById("logoutPopup").classList.add("show");
}

function closeLogoutPopup() {
  document.getElementById("logoutPopup").classList.remove("show");
}

function confirmLogout() {
  localStorage.removeItem("user");
  sessionStorage.clear();
  window.location.href = "Register.html";
}

// Make functions globally available if needed
window.showLogoutPopup = showLogoutPopup;
window.closeLogoutPopup = closeLogoutPopup;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Order history page loaded');
});