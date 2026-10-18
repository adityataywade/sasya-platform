/**
 * Helper functions — Timestamps, formatting, staleness detection
 */
import { STALE_THRESHOLD_MS } from './constants.js';

/**
 * Format a Unix timestamp (ms) to a readable string
 */
export function formatTimestamp(ts) {
  if (!ts || typeof ts !== 'number') return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Format relative time (e.g. "3 minutes ago")
 */
export function formatRelativeTime(ts) {
  if (!ts || typeof ts !== 'number') return '—';
  const now = Date.now();
  const diff = now - ts;
  if (diff < 0) return 'just now';
  if (diff < 60000) return 'just now';
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400000);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Check if telemetry data is stale (older than threshold)
 */
export function isDataStale(timestamp, thresholdMs = STALE_THRESHOLD_MS) {
  if (!timestamp || typeof timestamp !== 'number') return true;
  return (Date.now() - timestamp) > thresholdMs;
}

/**
 * Format a telemetry value with units, showing 'Unavailable' for null
 */
export function formatTelemetryValue(value, unit = '', decimals = 1) {
  if (value === null || value === undefined) return 'Unavailable';
  if (typeof value === 'number') {
    return `${value.toFixed(decimals)}${unit}`;
  }
  return String(value);
}
