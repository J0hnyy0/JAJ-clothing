// Breadcrumb Navigation System
const breadcrumbConfig = {
  'Homepage.html': { label: 'Home', path: 'Homepage.html' },
  'Collection.html': { label: 'Collection', path: 'Collection.html' },
  'Product.html': { label: 'Product', path: 'Product.html' },
  'Profile.html': { label: 'Profile', path: 'Profile.html' },
  'Orderhistory.html': { label: 'Order History', path: 'Orderhistory.html' },
  'Register.html': { label: 'Register', path: 'Register.html' }
};

function initBreadcrumb() {
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'Homepage.html';
  
  // Create breadcrumb container
  const breadcrumbContainer = document.createElement('nav');
  breadcrumbContainer.className = 'breadcrumb-nav';
  breadcrumbContainer.setAttribute('aria-label', 'Breadcrumb');
  
  // Build breadcrumb items
  const breadcrumbList = document.createElement('ol');
  breadcrumbList.className = 'breadcrumb-list';
  
  // Always start with Home
  const homeItem = createBreadcrumbItem('Home', 'Homepage.html', false);
  breadcrumbList.appendChild(homeItem);
  
  // Add current page if not home
  if (currentPage !== 'Homepage.html' && currentPage !== '') {
    const separator = createBreadcrumbSeparator();
    breadcrumbList.appendChild(separator);
    
    const config = breadcrumbConfig[currentPage];
    if (config) {
      const currentItem = createBreadcrumbItem(config.label, config.path, true);
      breadcrumbList.appendChild(currentItem);
    }
  }
  
  // Handle Product Details page with product name
  if (currentPage === 'Product.html') {
    try {
      const productData = JSON.parse(localStorage.getItem('selectedProduct') || '{}');
      if (productData.name) {
        const separator = createBreadcrumbSeparator();
        breadcrumbList.appendChild(separator);
        
        const productItem = createBreadcrumbItem(productData.name, null, true);
        breadcrumbList.appendChild(productItem);
      }
    } catch (error) {
      console.error('Error loading product data for breadcrumb:', error);
    }
  }
  
  breadcrumbContainer.appendChild(breadcrumbList);
  
  // Insert breadcrumb after header
  const header = document.querySelector('.header');
  if (header && header.nextSibling) {
    header.parentNode.insertBefore(breadcrumbContainer, header.nextSibling);
  } else if (header) {
    header.parentNode.appendChild(breadcrumbContainer);
  }
  
  // Add styles if not already present
  if (!document.getElementById('breadcrumb-styles')) {
    addBreadcrumbStyles();
  }
}

function createBreadcrumbItem(label, path, isCurrent) {
  const item = document.createElement('li');
  item.className = 'breadcrumb-item';
  
  if (isCurrent || !path) {
    item.classList.add('active');
    item.setAttribute('aria-current', 'page');
    item.textContent = label;
  } else {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = label;
    link.className = 'breadcrumb-link';
    item.appendChild(link);
  }
  
  return item;
}

function createBreadcrumbSeparator() {
  const separator = document.createElement('li');
  separator.className = 'breadcrumb-separator';
  separator.setAttribute('aria-hidden', 'true');
  separator.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>
    </svg>
  `;
  return separator;
}

function addBreadcrumbStyles() {
  const style = document.createElement('style');
  style.id = 'breadcrumb-styles';
  style.textContent = `
    .breadcrumb-nav {
      background: transparent;
      padding: 12px 40px;
      border-bottom: none;
    }
    
    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .breadcrumb-item {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #888888;
    }
    
    .breadcrumb-item.active {
      color: #cccccc;
      font-weight: 400;
    }
    
    .breadcrumb-link {
      color: #888888;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    
    .breadcrumb-link:hover {
      color: #ffffff;
    }
    
    .breadcrumb-separator {
      display: flex;
      align-items: center;
      margin: 0 8px;
      color: #555555;
    }
    
    .breadcrumb-separator svg {
      display: block;
      width: 12px;
      height: 12px;
    }
    
    @media (max-width: 768px) {
      .breadcrumb-nav {
        padding: 10px 20px;
      }
      
      .breadcrumb-item {
        font-size: 12px;
      }
      
      .breadcrumb-separator {
        margin: 0 6px;
      }
      
      .breadcrumb-separator svg {
        width: 10px;
        height: 10px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize breadcrumb when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBreadcrumb);
} else {
  initBreadcrumb();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initBreadcrumb };
}