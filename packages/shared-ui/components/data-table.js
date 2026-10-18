/**
 * Data Table Component — Paginated, searchable, sortable
 */

/**
 * @param {Object} options
 * @param {string[]} options.columns - Column definitions [{key, label, sortable?, render?}]
 * @param {Object[]} options.data - Row data
 * @param {number} [options.pageSize=10]
 * @param {string} [options.emptyMessage='No records found']
 * @param {Function} [options.onRowClick]
 */
export function createDataTable({ columns = [], data = [], pageSize = 10, emptyMessage = 'No records found', onRowClick = null, id = 'data-table' } = {}) {
  let currentPage = 0;
  let sortKey = null;
  let sortDir = 'asc';
  let searchTerm = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'data-table-wrapper';
  wrapper.id = id;

  function getFilteredData() {
    let filtered = [...data];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(term))
      );
    }
    if (sortKey) {
      filtered.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return filtered;
  }

  function render() {
    const filtered = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages - 1);
    const start = currentPage * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    wrapper.innerHTML = `
      <div class="data-table-toolbar">
        <div class="data-table-search">
          <input type="search" class="data-table-search-input" placeholder="Search..." value="${searchTerm}" aria-label="Search table">
        </div>
        <span class="data-table-count">${filtered.length} record${filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="data-table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              ${columns.map(col => `
                <th class="${col.sortable !== false ? 'sortable' : ''} ${sortKey === col.key ? `sorted-${sortDir}` : ''}" 
                    data-key="${col.key}"
                    ${col.sortable !== false ? 'role="button" tabindex="0"' : ''}>
                  ${col.label}
                  ${col.sortable !== false ? `<span class="sort-indicator">${sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>` : ''}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${pageData.length === 0 ? `
              <tr><td colspan="${columns.length}" class="data-table-empty">${emptyMessage}</td></tr>
            ` : pageData.map(row => `
              <tr class="${onRowClick ? 'clickable' : ''}" data-id="${row.id || ''}">
                ${columns.map(col => `<td>${col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
        <div class="data-table-pagination">
          <button class="btn btn-sm btn-secondary pagination-prev" ${currentPage === 0 ? 'disabled' : ''}>← Previous</button>
          <span class="pagination-info">Page ${currentPage + 1} of ${totalPages}</span>
          <button class="btn btn-sm btn-secondary pagination-next" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      ` : ''}
    `;

    // Bind events
    const searchInput = wrapper.querySelector('.data-table-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      currentPage = 0;
      render();
    });

    wrapper.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = 'asc';
        }
        render();
      });
    });

    wrapper.querySelector('.pagination-prev')?.addEventListener('click', () => {
      if (currentPage > 0) { currentPage--; render(); }
    });
    wrapper.querySelector('.pagination-next')?.addEventListener('click', () => {
      if (currentPage < totalPages - 1) { currentPage++; render(); }
    });

    if (onRowClick) {
      wrapper.querySelectorAll('tbody tr.clickable').forEach(tr => {
        tr.addEventListener('click', () => onRowClick(tr.dataset.id));
      });
    }
  }

  render();

  wrapper.updateData = (newData) => {
    data = newData;
    currentPage = 0;
    render();
  };

  return wrapper;
}
