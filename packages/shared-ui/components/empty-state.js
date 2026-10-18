/**
 * Empty State Component
 */
import { ICONS } from '../tokens.js';

export function createEmptyState({ icon = 'robot', title = 'No data available', message = '', actionLabel = '', onAction = null } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';

  wrapper.innerHTML = `
    <div class="empty-state-icon">${ICONS[icon] || ICONS.robot}</div>
    <h3 class="empty-state-title">${title}</h3>
    ${message ? `<p class="empty-state-message">${message}</p>` : ''}
    ${actionLabel ? `<button class="btn btn-primary empty-state-action">${actionLabel}</button>` : ''}
  `;

  if (onAction) {
    wrapper.querySelector('.empty-state-action')?.addEventListener('click', onAction);
  }

  return wrapper;
}
