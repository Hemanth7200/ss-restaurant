/* ============================================
   SS Restaurant — View Menu Only (Read-Only)
   Shown when table is occupied by another session.
   Customer can browse but NOT add to cart or order.
   Polls for table availability — auto-redirects when free.
   ============================================ */

function renderMenuItems() {
  const app = document.getElementById('app');
  
  // Get the table number from URL query
  const query = Router.getQuery();
  const tableNumber = query.table ? parseInt(query.table) : null;
  const tables = Store.get('tables') || [];
  const table = tableNumber ? tables.find(t => t.number === tableNumber) : null;

  const categories = (Store.get('categories') || []).filter(c => c.active).sort((a, b) => a.order - b.order);

  app.innerHTML = `
    <div class="menu-page">
      <!-- Desktop Sidebar -->
      <aside class="menu-sidebar">
        <div class="customer-header-left" style="margin-bottom: var(--space-xl);">
          <img src="assets/logo.png" alt="Logo" class="customer-header-logo" style="width: 48px; height: 48px;" />
          <div>
            <div class="customer-header-title">SS Restaurant</div>
            <div class="customer-header-table" style="color: var(--text-muted);">View Only Mode</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <a href="#/menuitems${tableNumber ? '?table=' + tableNumber : ''}" class="nav-item active">
            <span>📖</span> View Menu
          </a>
        </nav>

        <div class="slogan-card">
          <div class="slogan-text">Good food<br>Good mood ♡</div>
          <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left" style="cursor: pointer;" onclick="Router.navigate('/')">
            <img src="assets/logo.png" alt="Logo" class="customer-header-logo" />
            <div>
              <div class="customer-header-title">SS Restaurant</div>
              <div class="customer-header-table" style="color: var(--text-muted);">View Only</div>
            </div>
          </div>
        </header>

        <!-- View-Only Banner -->
        <div id="viewonly-banner" style="background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fed7aa; border-radius: var(--radius-lg); padding: 12px 16px; margin: 0 var(--space-md) var(--space-md); display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📖</span>
          <div style="flex:1;">
            <div style="font-weight: 700; font-size: var(--font-size-sm); color: #9a3412;">View Only Mode</div>
            <div style="font-size: 12px; color: #c2410c;">${tableNumber ? 'Table ' + tableNumber + ' is currently occupied.' : 'Browse our menu.'} Ordering is disabled.</div>
          </div>
          <div id="viewonly-status" style="width:10px;height:10px;border-radius:50%;background:#f97316;flex-shrink:0;" title="Table occupied"></div>
        </div>

        <div class="search-filter-container">
          <div class="search-box-wrapper">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="viewmenu-search" class="search-input" placeholder="Search menu..." autocomplete="off" />
            <button id="viewmenu-clear-search" class="clear-search-btn">✕</button>
          </div>

          <div class="filter-btn-wrapper">
            <button id="viewmenu-filter-btn" class="filter-trigger-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span>Filters</span>
            </button>
            <div id="viewmenu-filter-dropdown" class="filter-options-dropdown" style="display: none;">
              <div class="filter-section-title">Dietary</div>
              <div class="filter-option active" data-diet="all">Show All</div>
              <div class="filter-option" data-diet="veg">Veg Only</div>
              <div class="filter-option" data-diet="non-veg">Non-Veg Only</div>
              
              <div class="filter-divider"></div>
              
              <div class="filter-section-title">Sort By</div>
              <div class="filter-option active" data-sort="default">Default</div>
              <div class="filter-option" data-sort="a-z">A to Z</div>
              <div class="filter-option" data-sort="z-a">Z to A</div>
              <div class="filter-option" data-sort="price-low">Price: Low to High</div>
              <div class="filter-option" data-sort="price-high">Price: High to Low</div>
            </div>
          </div>
        </div>

        <div class="menu-categories" id="viewmenu-category-chips">
          <button class="chip active" data-cat="all">All</button>
          ${categories.map(c => `
            <button class="chip" data-cat="${c.id}">${c.name}</button>
          `).join('')}
        </div>

        <div class="menu-grid" id="viewmenu-grid"></div>
      </main>
    </div>
  `;

  // ---- State ----
  let activeCategory = 'all';
  let searchQuery = '';
  let activeSort = 'default';
  let activeDiet = 'all';

  // ---- Render items (read-only, no Add buttons) ----
  function renderViewMenuItems() {
    const grid = document.getElementById('viewmenu-grid');
    const clearBtn = document.getElementById('viewmenu-clear-search');
    if (!grid) return;

    const allItems = Store.get('menuItems') || [];
    let items = allItems.filter(m => m.active);

    // Filter by category
    if (activeCategory !== 'all') {
      items = items.filter(m => m.category === activeCategory);
    }

    // Filter by diet
    if (activeDiet === 'veg') {
      items = items.filter(m => m.isVeg === true);
    } else if (activeDiet === 'non-veg') {
      items = items.filter(m => m.isVeg === false);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      if (q.length === 1) {
        items = items.filter(m => m.name.toLowerCase().startsWith(q));
      } else if (q.length < 3) {
        items = items.filter(m => m.name.toLowerCase().includes(q));
      } else {
        items = items.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
        );
      }
      if (clearBtn) clearBtn.style.display = 'flex';
    } else {
      if (clearBtn) clearBtn.style.display = 'none';
    }

    // Sort
    switch (activeSort) {
      case 'a-z': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'z-a': items.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price-low': items.sort((a, b) => a.price - b.price); break;
      case 'price-high': items.sort((a, b) => b.price - a.price); break;
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No results${searchQuery ? ' for "' + Utils.escapeHtml(searchQuery) + '"' : ''}</h3>
          <p>Try a different keyword or clear filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(item => {
      const itemImage = item.image;
      const isUrl = itemImage && (itemImage.startsWith('http') || itemImage.startsWith('/') || itemImage.startsWith('assets') || itemImage.startsWith('data:image'));
      const gradient = Utils.getFoodGradient(item.image);

      return `
        <div class="menu-card" data-id="${item.id}">
          <div class="menu-card-img">
            ${isUrl
              ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain';" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;background:${gradient}">${itemImage || '🍽️'}</div>`
            }
          </div>
          <div class="menu-card-info">
            <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}"></span>
            <div class="menu-card-name">${Utils.escapeHtml(item.name)}</div>
            <div class="menu-card-desc">${Utils.escapeHtml(item.description)}</div>
            <div class="menu-card-bottom">
              <span class="menu-card-price">${Utils.formatPrice(item.price)}</span>
              <span style="font-size:11px;color:var(--text-muted);font-weight:500;">View Only</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Initial render
  renderViewMenuItems();

  // ---- Event Listeners ----

  // Category chips
  document.getElementById('viewmenu-category-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#viewmenu-category-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    renderViewMenuItems();
  });

  // Filter dropdown
  const filterBtn = document.getElementById('viewmenu-filter-btn');
  const filterDropdown = document.getElementById('viewmenu-filter-dropdown');
  if (filterBtn && filterDropdown) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.style.display = filterDropdown.style.display === 'block' ? 'none' : 'block';
    });

    filterDropdown.querySelectorAll('.filter-option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (opt.dataset.diet) {
          filterDropdown.querySelectorAll('[data-diet]').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          activeDiet = opt.dataset.diet;
        }
        if (opt.dataset.sort) {
          filterDropdown.querySelectorAll('[data-sort]').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          activeSort = opt.dataset.sort;
        }
        renderViewMenuItems();
        filterDropdown.style.display = 'none';
      });
    });

    document.addEventListener('click', (e) => {
      if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.style.display = 'none';
      }
    });
  }

  // Search
  const searchInput = document.getElementById('viewmenu-search');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce((e) => {
      searchQuery = e.target.value;
      renderViewMenuItems();
    }, 200));
  }

  const clearSearchBtn = document.getElementById('viewmenu-clear-search');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      renderViewMenuItems();
    });
  }

  // ---- Poll for table availability ----
  // When the table becomes free, show a banner and allow ordering
  let _viewMenuPoll = null;
  if (table) {
    _viewMenuPoll = setInterval(() => {
      const freshTables = Store.get('tables') || [];
      const freshTable = freshTables.find(t => t.id === table.id);
      const statusDot = document.getElementById('viewonly-status');
      const banner = document.getElementById('viewonly-banner');

      if (freshTable && freshTable.status === 'available') {
        clearInterval(_viewMenuPoll);
        
        // Table is now free — update banner
        if (banner) {
          banner.style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
          banner.style.borderColor = '#86efac';
          banner.innerHTML = `
            <span style="font-size: 20px;">🟢</span>
            <div style="flex:1;">
              <div style="font-weight: 700; font-size: var(--font-size-sm); color: #166534;">Table ${tableNumber} is now available!</div>
              <div style="font-size: 12px; color: #15803d;">You can now place your order.</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/?table=${tableNumber}'" style="flex-shrink:0;">
              Start Ordering →
            </button>
          `;
        }
        if (statusDot) statusDot.style.background = '#22c55e';
      }
    }, 3000);
  }

  // Cleanup on navigation
  const origHash = window.location.hash;
  window.addEventListener('hashchange', function viewMenuCleanup() {
    if (window.location.hash !== origHash) {
      if (_viewMenuPoll) clearInterval(_viewMenuPoll);
      window.removeEventListener('hashchange', viewMenuCleanup);
    }
  });
}
