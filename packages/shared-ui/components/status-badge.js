/**
 * Status Badge Component
 * Color-coded badges for robot/task statuses
 */

const STATUS_CONFIG = {
  online:      { label: 'Online',      className: 'badge-online' },
  offline:     { label: 'Offline',     className: 'badge-offline' },
  unknown:     { label: 'Unknown',     className: 'badge-unknown' },
  cleaning:    { label: 'Cleaning',    className: 'badge-cleaning' },
  idle:        { label: 'Idle',        className: 'badge-idle' },
  healthy:     { label: 'Healthy',     className: 'badge-healthy' },
  warning:     { label: 'Warning',     className: 'badge-warning' },
  critical:    { label: 'Critical',    className: 'badge-critical' },
  maintenance: { label: 'Maintenance', className: 'badge-maintenance' },
  pending:     { label: 'Pending',     className: 'badge-pending' },
  completed:   { label: 'Completed',   className: 'badge-completed' },
  scheduled:   { label: 'Scheduled',   className: 'badge-scheduled' },
  demo:        { label: 'Demo Data',   className: 'badge-demo' },
  unavailable: { label: 'Unavailable', className: 'badge-unknown' },
};

/**
 * @param {string} status - Status key
 * @param {string} [customLabel] - Override label
 */
export function createStatusBadge(status, customLabel) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const span = document.createElement('span');
  span.className = `status-badge ${config.className}`;
  span.textContent = customLabel || config.label;
  span.setAttribute('data-status', status);
  return span;
}
