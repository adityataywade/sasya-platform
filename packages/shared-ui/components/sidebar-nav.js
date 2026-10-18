/**
 * Sidebar Navigation Component — Used by portal apps
 */
import { getSasyaLogoSVG, ICONS } from '../tokens.js';

/**
 * @param {Object} options
 * @param {string} options.portalName - e.g. 'Customer Portal'
 * @param {Array<{icon:string, label:string, id:string, href:string}>} options.navItems
 * @param {string} options.currentPage
 * @param {Object} [options.user] - {name, email, role}
 * @param {Function} [options.onSignOut]
 */
export function createSidebarNav({ portalName = '', navItems = [], currentPage = '', user = null, onSignOut = null } = {}) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar-nav';
  sidebar.id = 'sidebar-nav';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="/" class="sidebar-logo" aria-label="Sasya Innovations">
        ${getSasyaLogoSVG(32)}
        <div class="sidebar-logo-text">
          <span class="sidebar-brand"><span class="logo-green">Sasya</span></span>
          <span class="sidebar-portal-name">${portalName}</span>
        </div>
      </a>
      <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" aria-label="Collapse sidebar">
        ${ICONS.chevronLeft}
      </button>
    </div>

    <nav class="sidebar-menu" aria-label="${portalName} navigation">
      <ul class="sidebar-menu-list">
        ${navItems.map(item => `
          <li>
            <a href="${item.href}" 
               class="sidebar-menu-link ${currentPage === item.id ? 'active' : ''}"
               id="sidebar-${item.id}"
               ${currentPage === item.id ? 'aria-current="page"' : ''}>
              <span class="sidebar-menu-icon">${ICONS[item.icon] || ''}</span>
              <span class="sidebar-menu-label">${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </nav>

    <div class="sidebar-footer">
      ${user ? `
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">${user.name || 'User'}</span>
            <span class="sidebar-user-role">${user.role || ''}</span>
          </div>
        </div>
      ` : ''}
      <button class="sidebar-signout-btn" id="sidebar-signout-btn" aria-label="Sign out">
        ${ICONS.logout}
        <span>Sign Out</span>
      </button>
    </div>
  `;

  if (onSignOut) {
    sidebar.querySelector('#sidebar-signout-btn')?.addEventListener('click', onSignOut);
  }

  // Collapse logic
  const collapseBtn = sidebar.querySelector('#sidebar-collapse-btn');
  collapseBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    collapseBtn.innerHTML = isCollapsed ? ICONS.chevronRight : ICONS.chevronLeft;
    collapseBtn.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  });

  return sidebar;
}

/**
 * Create the demo-mode banner shown atop portal dashboards
 */
export function createDemoBanner() {
  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.id = 'demo-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <span class="demo-banner-icon">⚠</span>
    <span class="demo-banner-text">
      <strong>Demo Mode</strong> — Showing simulated data. No Firebase credentials configured.
    </span>
  `;
  return banner;
}
