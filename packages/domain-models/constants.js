/**
 * Domain Constants — Shared enumerations for the Sasya platform
 */

/** Robot operational status */
export const ROBOT_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CLEANING: 'cleaning',
  IDLE: 'idle',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown',
};

/** Maintenance health status */
export const MAINTENANCE_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown',
};

/** User roles — assigned through trusted provisioning only */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  PARTNER: 'partner',
  ADMIN: 'admin',
};

/** Task status for setup/maintenance jobs */
export const TASK_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/** Task priority */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Expected telemetry fields from the SCR robot.
 * The R&D team must validate these field names, units, and ranges
 * before live ESP32 integration.
 */
export const TELEMETRY_FIELDS = {
  robotId:           { type: 'string',  required: true,  description: 'Unique robot identifier' },
  timestamp:         { type: 'number',  required: true,  description: 'Unix timestamp (ms)' },
  status:            { type: 'string',  required: false, description: 'Operational status', validValues: Object.values(ROBOT_STATUS) },
  batteryPercent:    { type: 'number',  required: false, description: 'Battery level 0–100', min: 0, max: 100 },
  waterLevelPercent: { type: 'number',  required: false, description: 'Water level 0–100', min: 0, max: 100 },
  temperatureC:      { type: 'number',  required: false, description: 'Temperature in Celsius', min: -20, max: 80 },
  humidityPercent:   { type: 'number',  required: false, description: 'Humidity 0–100 (DHT11)', min: 0, max: 100 },
  maintenanceStatus: { type: 'string',  required: false, description: 'Health status', validValues: Object.values(MAINTENANCE_STATUS) },
  obstacleDetected:  { type: 'boolean', required: false, description: 'HC-SR04 obstacle flag' },
  vibrationLevel:    { type: 'number',  required: false, description: 'MPU6050 vibration reading' },
};

/** Stale data threshold — telemetry older than this is marked as stale */
export const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/** Default page sizes */
export const PAGE_SIZES = {
  TABLE: 10,
  EVENTS: 20,
  HISTORY: 25,
};
