/**
 * @sasya/telemetry-service — Robot telemetry data service
 * 
 * Provides a common interface for subscribing to robot telemetry.
 * The frontend never depends directly on the ESP32 communication protocol.
 * 
 * ARCHITECTURE:
 * - MockTelemetryProvider: Works without Firebase, uses demo fixtures
 * - FirebaseTelemetryProvider: Reads from Firebase Realtime Database
 * - Both implement the same interface
 * 
 * Configure via VITE_DATA_MODE env variable:
 * - 'demo' (default): Use mock provider
 * - 'firebase': Use Firebase provider (requires valid config)
 */

export { createTelemetryService } from './telemetry-service.js';
export { MockTelemetryProvider } from './mock-provider.js';
export { FirebaseTelemetryProvider } from './firebase-provider.js';
