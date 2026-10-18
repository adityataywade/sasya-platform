/**
 * Shared Header Component — Sasya Innovations
 * Used by the public site. Portal apps use sidebar navigation.
 */
import { getSasyaLogoSVG, ICONS } from '../tokens.js';

/**
 * @param {Object} options
 * @param {string} options.currentPage - Active page identifier
 * @param {Array<{label:string, href:string, id:string}>} options.navItems
 * @param {string} [options.logoHref='/']
 */
export function createHeader({ currentPage = '', navItems = [], logoHref = '/' } = {}) {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.id = 'site-header';

  const defaultNav = [
    { label: 'HOME', href: '/', id: 'home' },
    { label: 'ABOUT', href: '/about', id: 'about' },
    { label: 'PRODUCTS', href: '/products', id: 'products' },
    { label: 'SASYA R&D', href: '/rnd', id: 'rnd' },
    { label: 'CAREERS', href: '/careers', id: 'careers' },
    { label: 'CONTACT', href: '/contact', id: 'contact' },
  ];

  const links = navItems.length > 0 ? navItems : defaultNav;

  header.innerHTML = `
    <div class="header-inner">
      <a href="${logoHref}" class="header-logo" id="header-logo" aria-label="Sasya Innovations Home">
        ${getSasyaLogoSVG(42)}
        <div class="header-logo-text">
          <span class="header-logo-brand"><span class="logo-green">Sasya</span> Innovations</span>
          <span class="header-logo-tagline">Smartly <em>Made</em>, With <em>Love</em></span>
        </div>
      </a>
      <nav class="header-nav" id="header-nav" aria-label="Main navigation">
        <ul class="header-nav-list">
          ${links.map(item => `
            <li>
              <a href="${item.href}" 
                 class="header-nav-link ${currentPage === item.id ? 'active' : ''}"
                 id="nav-${item.id}"
                 ${currentPage === item.id ? 'aria-current="page"' : ''}>
                ${item.label}
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
      <button class="header-mobile-toggle" id="mobile-menu-toggle" aria-label="Open menu" aria-expanded="false">
        ${ICONS.menu}
      </button>
    </div>
  `;

  return header;
}
