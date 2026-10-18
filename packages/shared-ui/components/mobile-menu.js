/**
 * Mobile Menu Component — Sasya Innovations
 * Slide-in overlay navigation for smaller screens
 */
import { ICONS, getSasyaLogoSVG } from '../tokens.js';

export function createMobileMenu({ navItems = [], currentPage = '' } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  overlay.id = 'mobile-menu-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const defaultNav = [
    { label: 'HOME', href: '/', id: 'home' },
    { label: 'ABOUT', href: '/about', id: 'about' },
    { label: 'PRODUCTS', href: '/products', id: 'products' },
    { label: 'SASYA R&D', href: '/rnd', id: 'rnd' },
    { label: 'CAREERS', href: '/careers', id: 'careers' },
    { label: 'CONTACT', href: '/contact', id: 'contact' },
  ];

  const links = navItems.length > 0 ? navItems : defaultNav;

  overlay.innerHTML = `
    <div class="mobile-menu-panel" id="mobile-menu-panel" role="dialog" aria-label="Navigation menu">
      <div class="mobile-menu-header">
        <a href="/" class="mobile-menu-logo" aria-label="Sasya Innovations Home">
          ${getSasyaLogoSVG(36)}
          <span class="mobile-menu-brand"><span class="logo-green">Sasya</span> Innovations</span>
        </a>
        <button class="mobile-menu-close" id="mobile-menu-close" aria-label="Close menu">
          ${ICONS.close}
        </button>
      </div>
      <nav class="mobile-menu-nav" aria-label="Mobile navigation">
        <ul class="mobile-menu-list">
          ${links.map(item => `
            <li>
              <a href="${item.href}" 
                 class="mobile-menu-link ${currentPage === item.id ? 'active' : ''}"
                 ${currentPage === item.id ? 'aria-current="page"' : ''}>
                ${item.label}
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
    </div>
  `;

  return overlay;
}

/**
 * Initialize mobile menu interactions
 */
export function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const overlay = document.getElementById('mobile-menu-overlay');
  const closeBtn = document.getElementById('mobile-menu-close');
  const panel = document.getElementById('mobile-menu-panel');

  if (!toggle || !overlay) return;

  function openMenu() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  }

  toggle.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeMenu();
    }
  });
}
