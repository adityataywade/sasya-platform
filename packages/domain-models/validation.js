/**
 * Data Validation — Telemetry, Robot, and User records
 */
import { TELEMETRY_FIELDS, ROBOT_STATUS, MAINTENANCE_STATUS, USER_ROLES } from './constants.js';

/**
 * Validate a telemetry payload. Returns { valid, errors, sanitized }.
 * Missing optional fields are set to null, not zero.
 */
export function validateTelemetry(data) {
  const errors = [];
  const sanitized = {};

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload is not an object'], sanitized: null };
  }

  for (const [field, spec] of Object.entries(TELEMETRY_FIELDS)) {
    const value = data[field];

    if (value === undefined || value === null) {
      if (spec.required) {
        errors.push(`Missing required field: ${field}`);
      } else {
        sanitized[field] = null;
      }
      continue;
    }

    // Type check
    if (spec.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field}: expected number, got ${typeof value}`);
        sanitized[field] = null;
        continue;
      }
      if (spec.min !== undefined && num < spec.min) {
        errors.push(`${field}: value ${num} below minimum ${spec.min}`);
        sanitized[field] = null;
        continue;
      }
      if (spec.max !== undefined && num > spec.max) {
        errors.push(`${field}: value ${num} above maximum ${spec.max}`);
        sanitized[field] = null;
        continue;
      }
      sanitized[field] = num;
    } else if (spec.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${field}: expected string, got ${typeof value}`);
        sanitized[field] = null;
        continue;
      }
      if (spec.validValues && !spec.validValues.includes(value)) {
        errors.push(`${field}: invalid value "${value}". Expected: ${spec.validValues.join(', ')}`);
        sanitized[field] = null;
        continue;
      }
      sanitized[field] = value;
    } else if (spec.type === 'boolean') {
      sanitized[field] = Boolean(value);
    } else {
      sanitized[field] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.some(e => e.includes('required')) ? null : sanitized,
  };
}

/**
 * Validate a robot record
 */
export function validateRobot(robot) {
  const errors = [];
  if (!robot?.id) errors.push('Missing robot id');
  if (!robot?.robotId) errors.push('Missing robotId');
  if (robot.status && !Object.values(ROBOT_STATUS).includes(robot.status)) {
    errors.push(`Invalid robot status: ${robot.status}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a user record
 */
export function validateUser(user) {
  const errors = [];
  if (!user?.uid) errors.push('Missing uid');
  if (!user?.email) errors.push('Missing email');
  if (user.role && !Object.values(USER_ROLES).includes(user.role)) {
    errors.push(`Invalid role: ${user.role}`);
  }
  return { valid: errors.length === 0, errors };
}
