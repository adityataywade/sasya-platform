/**
 * Stat Card Component — Dashboard summary cards
 */

/**
 * @param {Object} options
 * @param {string} options.icon - SVG icon string
 * @param {string} options.label
 * @param {string|number} options.value
 * @param {string} [options.trend] - e.g. '+5%'
 * @param {string} [options.trendDir] - 'up' | 'down' | 'neutral'
 * @param {string} [options.subtitle]
 * @param {string} [options.color] - CSS color for accent
 */
export function createStatCard({ icon = '', label = '', value = '—', trend = '', trendDir = 'neutral', subtitle = '', color = '' } = {}) {
  const card = document.createElement('div');
  card.className = 'stat-card';
  if (color) card.style.setProperty('--stat-accent', color);

  card.innerHTML = `
    <div class="stat-card-header">
      <div class="stat-card-icon">${icon}</div>
      <div class="stat-card-label">${label}</div>
    </div>
    <div class="stat-card-value">${value}</div>
    ${trend ? `<div class="stat-card-trend trend-${trendDir}">${trend}</div>` : ''}
    ${subtitle ? `<div class="stat-card-subtitle">${subtitle}</div>` : ''}
  `;

  return card;
}
