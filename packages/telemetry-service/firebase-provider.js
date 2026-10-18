/**
 * Firebase Telemetry Provider
 * 
 * Reads robot telemetry from Firebase Realtime Database.
 * Requires a valid initialized Firebase app.
 * 
 * NOTE: This provider is a scaffold. It will function once:
 * 1. Firebase project is created and configured
 * 2. Environment variables are set
 * 3. Database security rules are deployed
 * 4. ESP32 devices are provisioned to write telemetry
 * 
 * Browser-exposed Firebase config is NOT a secret.
 * Security comes from Authentication + Database Rules.
 */
import { validateTelemetry } from '@sasya/domain-models';

export class FirebaseTelemetryProvider {
  constructor(firebaseApp) {
    this._app = firebaseApp;
    this._db = null;
    this._subscriptions = new Map();
    this._mode = 'firebase';
    this._initialized = false;

    this._init();
  }

  async _init() {
    try {
      // Dynamic import — only loaded when firebase mode is active
      const { getDatabase, ref, onValue, off, query, orderByChild, limitToLast } = await import('firebase/database');
      this._db = getDatabase(this._app);
      this._dbHelpers = { ref, onValue, off, query, orderByChild, limitToLast };
      this._initialized = true;
    } catch (err) {
      console.error('[FirebaseTelemetryProvider] Failed to initialize Firebase Database:', err.message);
      this._initialized = false;
    }
  }

  get mode() { return this._mode; }
  get isDemo() { return false; }

  subscribeLatestTelemetry(robotId, onData, onError) {
    if (!this._initialized || !this._db) {
      onError?.(new Error('Firebase Database not initialized. Check Firebase configuration.'));
      return () => {};
    }

    const { ref, onValue } = this._dbHelpers;
    const telemetryRef = ref(this._db, `robotLatest/${robotId}`);

    const unsubscribe = onValue(telemetryRef, (snapshot) => {
      const rawData = snapshot.val();
      if (!rawData) {
        onData({
          robotId,
          timestamp: null,
          _source: 'firebase',
          _noData: true,
        });
        return;
      }

      const result = validateTelemetry(rawData);
      if (result.valid) {
        onData({ ...result.sanitized, _source: 'firebase' });
      } else {
        console.warn(`[Telemetry] Validation errors for ${robotId}:`, result.errors);
        onData({
          ...result.sanitized,
          _source: 'firebase',
          _validationErrors: result.errors,
        });
      }
    }, (error) => {
      onError?.(error);
    });

    this._subscriptions.set(robotId, { telemetryRef, unsubscribe });

    return () => {
      const sub = this._subscriptions.get(robotId);
      if (sub) {
        const { off } = this._dbHelpers;
        off(sub.telemetryRef);
        this._subscriptions.delete(robotId);
      }
    };
  }

  async getLatestTelemetry(robotId) {
    if (!this._initialized || !this._db) return null;

    const { ref, onValue } = this._dbHelpers;
    return new Promise((resolve) => {
      const telemetryRef = ref(this._db, `robotLatest/${robotId}`);
      onValue(telemetryRef, (snapshot) => {
        const rawData = snapshot.val();
        if (!rawData) { resolve(null); return; }
        const result = validateTelemetry(rawData);
        resolve({ ...result.sanitized, _source: 'firebase' });
      }, { onlyOnce: true });
    });
  }

  async getRecentEvents(robotId, { limit = 20 } = {}) {
    if (!this._initialized || !this._db) return [];

    const { ref, query, orderByChild, limitToLast, onValue } = this._dbHelpers;
    return new Promise((resolve) => {
      const eventsRef = query(
        ref(this._db, `robotEvents/${robotId}`),
        orderByChild('timestamp'),
        limitToLast(limit)
      );
      onValue(eventsRef, (snapshot) => {
        const events = [];
        snapshot.forEach(child => {
          events.push({ id: child.key, ...child.val(), _source: 'firebase' });
        });
        events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(events);
      }, { onlyOnce: true });
    });
  }

  getTelemetryConnectionState(robotId) {
    return {
      mode: 'firebase',
      connected: this._initialized,
      lastReceived: null,
      status: this._initialized ? 'connected' : 'not_configured',
      message: this._initialized 
        ? 'Connected to Firebase Realtime Database' 
        : 'Firebase not configured — check environment variables',
    };
  }

  dispose() {
    if (this._dbHelpers) {
      const { off } = this._dbHelpers;
      for (const sub of this._subscriptions.values()) {
        off(sub.telemetryRef);
      }
    }
    this._subscriptions.clear();
  }
}
