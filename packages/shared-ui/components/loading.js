/**
 * Loading Components — Spinners and Skeleton Cards
 */

export function createLoadingSpinner(message = 'Loading...') {
  const wrapper = document.createElement('div');
  wrapper.className = 'loading-spinner-wrapper';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
    </div>
    <p class="loading-message">${message}</p>
  `;
  return wrapper;
}

export function createSkeletonCard(count = 1) {
  const container = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text short"></div>
      <div class="skeleton-row">
        <div class="skeleton-badge"></div>
        <div class="skeleton-badge"></div>
      </div>
    `;
    container.appendChild(card);
  }
  return container;
}
