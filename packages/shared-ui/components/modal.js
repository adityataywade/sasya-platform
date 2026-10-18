/**
 * Modal & Confirm Dialog Components
 */

export function createModal({ title = '', content = '', onClose = null } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);

  overlay.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">${typeof content === 'string' ? content : ''}</div>
    </div>
  `;

  if (typeof content !== 'string' && content instanceof HTMLElement) {
    overlay.querySelector('.modal-body').appendChild(content);
  }

  const closeBtn = overlay.querySelector('.modal-close-btn');

  function close() {
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.remove();
      onClose?.();
    }, 200);
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  requestAnimationFrame(() => overlay.classList.add('open'));

  return { element: overlay, close };
}

export function createConfirmDialog({ title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm = null, onCancel = null, danger = false } = {}) {
  const body = document.createElement('div');
  body.innerHTML = `
    <p class="confirm-message">${message}</p>
    <div class="confirm-actions">
      <button class="btn btn-secondary confirm-cancel">${cancelLabel}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} confirm-ok">${confirmLabel}</button>
    </div>
  `;

  const modal = createModal({ title, content: body });

  body.querySelector('.confirm-cancel').addEventListener('click', () => {
    modal.close();
    onCancel?.();
  });
  body.querySelector('.confirm-ok').addEventListener('click', () => {
    modal.close();
    onConfirm?.();
  });

  return modal;
}
