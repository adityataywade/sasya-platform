/**
 * @sasya/domain-models — Shared data models, constants, validation, and demo fixtures
 * 
 * All four applications MUST use these shared definitions.
 * Do NOT invent separate robot schemas per portal.
 */

export { ROBOT_STATUS, MAINTENANCE_STATUS, USER_ROLES, TASK_STATUS, TASK_PRIORITY, TELEMETRY_FIELDS } from './constants.js';
export { validateTelemetry, validateRobot, validateUser } from './validation.js';
export { DEMO_ROBOTS, DEMO_USERS, DEMO_EVENTS, DEMO_TASKS, DEMO_SETUP_JOBS, getDemoRobotsForCustomer, getDemoRobotsForPartner } from './fixtures.js';
export { formatTimestamp, formatRelativeTime, isDataStale, formatTelemetryValue } from './helpers.js';
