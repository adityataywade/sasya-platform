/**
 * Mock Telemetry Provider
 * Provides simulated robot telemetry using demo fixtures.
 * Works without Firebase credentials.
 * 
 * All data is clearly identified as simulated.
 */
import { DEMO_ROBOTS, DEMO_EVENTS } from '@sasya/domain-models';
import { validateTelemetry } from '@sasya/domain-models';

export class MockTelemetryProvider {
  constructor() {
    this._subscriptions = new Map();
    this._mode = 'demo';
  }

  get mode() { return this._mode; }
  get isDemo() { return true; }

  /**
   * Subscribe to latest telemetry for a robot
   * @param {string} robotId 
   * @param {Function} onData - Called with normalized telemetry
   * @param {Function} onError - Called on error
   * @returns {Function} unsubscribe
   */
  subscribeLatestTelemetry(robotId, onData, onError) {
    const robot = DEMO_ROBOTS.find(r => r.robotId === robotId);
    
    if (!robot) {
      onError?.(new Error(`Robot ${robotId} not found in demo data`));
      return () => {};
    }

    // Simulate initial delivery
    const timeoutId = setTimeout(() => {
      if (robot.latestTelemetry) {
        const result = validateTelemetry(robot.latestTelemetry);
        onData({
          ...result.sanitized,
          _source: 'demo',
          _demo: true,
        });
      } else {
        onData({
          robotId,
          timestamp: null,
          status: 'unknown',
          batteryPercent: null,
          waterLevelPercent: null,
          temperatureC: null,
          _source: 'demo',
          _demo: true,
          _noData: true,
        });
      }
    }, 300); // Simulate network delay

    this._subscriptions.set(robotId, timeoutId);

    return () => {
      clearTimeout(timeoutId);
      this._subscriptions.delete(robotId);
    };
  }

  /**
   * Get latest telemetry snapshot (one-time)
   */
  async getLatestTelemetry(robotId) {
    const robot = DEMO_ROBOTS.find(r => r.robotId === robotId);
    if (!robot?.latestTelemetry) return null;
    
    const result = validateTelemetry(robot.latestTelemetry);
    return { ...result.sanitized, _source: 'demo', _demo: true };
  }

  /**
   * Get recent events for a robot
   */
  async getRecentEvents(robotId, { limit = 20 } = {}) {
    return DEMO_EVENTS
      .filter(e => e.robotId === robotId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(e => ({ ...e, _source: 'demo', _demo: true }));
  }

  /**
   * Get connection state information
   */
  getTelemetryConnectionState(robotId) {
    const robot = DEMO_ROBOTS.find(r => r.robotId === robotId);
    return {
      mode: 'demo',
      connected: false,
      lastReceived: robot?.lastSeen || null,
      status: 'demo_mode',
      message: 'Showing simulated data — no live connection',
    };
  }

  /**
   * Clean up all subscriptions
   */
  dispose() {
    for (const timeoutId of this._subscriptions.values()) {
      clearTimeout(timeoutId);
    }
    this._subscriptions.clear();
  }
}
