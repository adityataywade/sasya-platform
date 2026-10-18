/**
 * Telemetry Service Factory
 * Creates the appropriate telemetry provider based on configuration.
 */
import { MockTelemetryProvider } from './mock-provider.js';
import { FirebaseTelemetryProvider } from './firebase-provider.js';

/**
 * @param {Object} options
 * @param {'demo'|'firebase'} options.mode
 * @param {Object} [options.firebaseApp] - Initialized Firebase app (required for firebase mode)
 */
export function createTelemetryService({ mode = 'demo', firebaseApp = null } = {}) {
  if (mode === 'firebase') {
    if (!firebaseApp) {
      console.warn('[TelemetryService] Firebase mode requested but no Firebase app provided. Falling back to demo mode.');
      return new MockTelemetryProvider();
    }
    return new FirebaseTelemetryProvider(firebaseApp);
  }

  return new MockTelemetryProvider();
}
