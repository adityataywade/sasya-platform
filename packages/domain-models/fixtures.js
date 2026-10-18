/**
 * Demo Fixtures — Realistic simulated data
 * 
 * IMPORTANT: All data is simulated for development purposes.
 * These records are clearly identified as demo data.
 * Do not present simulated data as real measurements.
 */
import { ROBOT_STATUS, MAINTENANCE_STATUS, USER_ROLES, TASK_STATUS, TASK_PRIORITY } from './constants.js';

const NOW = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

// ── Demo Robots ─────────────────────────────────────────────

export const DEMO_ROBOTS = [
  {
    id: 'SCR-001',
    robotId: 'SCR-001',
    name: 'Alpha Unit 1',
    model: 'SCR Alpha A1',
    status: ROBOT_STATUS.CLEANING,
    maintenanceStatus: MAINTENANCE_STATUS.HEALTHY,
    installationSite: 'Nashik Solar Farm — Block A',
    customerId: 'cust-001',
    customerName: 'Maharashtra Solar Energy Ltd.',
    partnerId: 'part-001',
    partnerName: 'SolarTech Solutions',
    commissionedDate: NOW - 30 * DAY,
    firmwareVersion: '0.1.0-dev',
    lastSeen: NOW - 2 * 60000,
    latestTelemetry: {
      robotId: 'SCR-001',
      timestamp: NOW - 2 * 60000,
      status: ROBOT_STATUS.CLEANING,
      batteryPercent: 78,
      waterLevelPercent: 91,
      temperatureC: 34.6,
      humidityPercent: 52,
      maintenanceStatus: MAINTENANCE_STATUS.HEALTHY,
      obstacleDetected: false,
      vibrationLevel: 0.12,
    },
    _demo: true,
  },
  {
    id: 'SCR-002',
    robotId: 'SCR-002',
    name: 'Alpha Unit 2',
    model: 'SCR Alpha A1',
    status: ROBOT_STATUS.IDLE,
    maintenanceStatus: MAINTENANCE_STATUS.WARNING,
    installationSite: 'Pune Industrial Park — Rooftop Array',
    customerId: 'cust-001',
    customerName: 'Maharashtra Solar Energy Ltd.',
    partnerId: 'part-001',
    partnerName: 'SolarTech Solutions',
    commissionedDate: NOW - 45 * DAY,
    firmwareVersion: '0.1.0-dev',
    lastSeen: NOW - 35 * 60000,
    latestTelemetry: {
      robotId: 'SCR-002',
      timestamp: NOW - 35 * 60000,
      status: ROBOT_STATUS.IDLE,
      batteryPercent: 42,
      waterLevelPercent: 23,
      temperatureC: 38.2,
      humidityPercent: 45,
      maintenanceStatus: MAINTENANCE_STATUS.WARNING,
      obstacleDetected: false,
      vibrationLevel: 0.08,
    },
    _demo: true,
  },
  {
    id: 'SCR-003',
    robotId: 'SCR-003',
    name: 'Alpha Unit 3',
    model: 'SCR Alpha A1',
    status: ROBOT_STATUS.OFFLINE,
    maintenanceStatus: MAINTENANCE_STATUS.CRITICAL,
    installationSite: 'Aurangabad Solar Plant — Section C',
    customerId: 'cust-002',
    customerName: 'Green Horizon Energy Pvt. Ltd.',
    partnerId: 'part-002',
    partnerName: 'RoboClean Services',
    commissionedDate: NOW - 60 * DAY,
    firmwareVersion: '0.1.0-dev',
    lastSeen: NOW - 8 * HOUR,
    latestTelemetry: {
      robotId: 'SCR-003',
      timestamp: NOW - 8 * HOUR,
      status: ROBOT_STATUS.OFFLINE,
      batteryPercent: 5,
      waterLevelPercent: 0,
      temperatureC: 41.3,
      humidityPercent: 38,
      maintenanceStatus: MAINTENANCE_STATUS.CRITICAL,
      obstacleDetected: true,
      vibrationLevel: 2.4,
    },
    _demo: true,
  },
  {
    id: 'SCR-004',
    robotId: 'SCR-004',
    name: 'Alpha Unit 4',
    model: 'SCR Alpha A1',
    status: ROBOT_STATUS.ONLINE,
    maintenanceStatus: MAINTENANCE_STATUS.HEALTHY,
    installationSite: 'Kolhapur Agri Solar — Field B',
    customerId: 'cust-002',
    customerName: 'Green Horizon Energy Pvt. Ltd.',
    partnerId: 'part-002',
    partnerName: 'RoboClean Services',
    commissionedDate: NOW - 15 * DAY,
    firmwareVersion: '0.1.0-dev',
    lastSeen: NOW - 1 * 60000,
    latestTelemetry: {
      robotId: 'SCR-004',
      timestamp: NOW - 1 * 60000,
      status: ROBOT_STATUS.ONLINE,
      batteryPercent: 95,
      waterLevelPercent: 88,
      temperatureC: 31.0,
      humidityPercent: 60,
      maintenanceStatus: MAINTENANCE_STATUS.HEALTHY,
      obstacleDetected: false,
      vibrationLevel: 0.05,
    },
    _demo: true,
  },
  {
    id: 'SCR-005',
    robotId: 'SCR-005',
    name: 'Alpha Unit 5',
    model: 'SCR Alpha A1',
    status: ROBOT_STATUS.UNKNOWN,
    maintenanceStatus: MAINTENANCE_STATUS.UNKNOWN,
    installationSite: 'Nagpur Tech Park — Carport Array',
    customerId: 'cust-003',
    customerName: 'Vidarbha Renewables Co.',
    partnerId: 'part-001',
    partnerName: 'SolarTech Solutions',
    commissionedDate: null,
    firmwareVersion: null,
    lastSeen: null,
    latestTelemetry: null,
    _demo: true,
  },
];

// ── Demo Users ──────────────────────────────────────────────

export const DEMO_USERS = [
  {
    uid: 'cust-001',
    email: 'demo-customer1@example.com',
    name: 'Rajesh Patel',
    role: USER_ROLES.CUSTOMER,
    company: 'Maharashtra Solar Energy Ltd.',
    phone: null,
    assignedRobots: ['SCR-001', 'SCR-002'],
    _demo: true,
  },
  {
    uid: 'cust-002',
    email: 'demo-customer2@example.com',
    name: 'Priya Sharma',
    role: USER_ROLES.CUSTOMER,
    company: 'Green Horizon Energy Pvt. Ltd.',
    phone: null,
    assignedRobots: ['SCR-003', 'SCR-004'],
    _demo: true,
  },
  {
    uid: 'cust-003',
    email: 'demo-customer3@example.com',
    name: 'Ankit Deshmukh',
    role: USER_ROLES.CUSTOMER,
    company: 'Vidarbha Renewables Co.',
    phone: null,
    assignedRobots: ['SCR-005'],
    _demo: true,
  },
  {
    uid: 'part-001',
    email: 'demo-partner1@example.com',
    name: 'Vikram Joshi',
    role: USER_ROLES.PARTNER,
    company: 'SolarTech Solutions',
    phone: null,
    assignedRobots: ['SCR-001', 'SCR-002', 'SCR-005'],
    _demo: true,
  },
  {
    uid: 'part-002',
    email: 'demo-partner2@example.com',
    name: 'Amit Kulkarni',
    role: USER_ROLES.PARTNER,
    company: 'RoboClean Services',
    phone: null,
    assignedRobots: ['SCR-003', 'SCR-004'],
    _demo: true,
  },
  {
    uid: 'admin-001',
    email: 'demo-admin@example.com',
    name: 'Sasya Admin',
    role: USER_ROLES.ADMIN,
    company: 'Sasya Innovations',
    phone: null,
    assignedRobots: [],
    _demo: true,
  },
];

// ── Demo Events ─────────────────────────────────────────────

export const DEMO_EVENTS = [
  { id: 'evt-001', robotId: 'SCR-001', type: 'cleaning_started', timestamp: NOW - 1 * HOUR, description: 'Cleaning cycle initiated', _demo: true },
  { id: 'evt-002', robotId: 'SCR-001', type: 'cleaning_completed', timestamp: NOW - 30 * 60000, description: 'Cleaning cycle completed — 24 panels cleaned', _demo: true },
  { id: 'evt-003', robotId: 'SCR-002', type: 'low_water', timestamp: NOW - 2 * HOUR, description: 'Water level below 25%', _demo: true },
  { id: 'evt-004', robotId: 'SCR-003', type: 'obstacle_detected', timestamp: NOW - 6 * HOUR, description: 'Obstacle detected — cleaning paused', _demo: true },
  { id: 'evt-005', robotId: 'SCR-003', type: 'connection_lost', timestamp: NOW - 8 * HOUR, description: 'Device connection lost', _demo: true },
  { id: 'evt-006', robotId: 'SCR-004', type: 'cleaning_completed', timestamp: NOW - 3 * HOUR, description: 'Cleaning cycle completed — 18 panels cleaned', _demo: true },
  { id: 'evt-007', robotId: 'SCR-001', type: 'battery_low', timestamp: NOW - 4 * HOUR, description: 'Battery below 20% — returning to dock', _demo: true },
  { id: 'evt-008', robotId: 'SCR-002', type: 'maintenance_due', timestamp: NOW - 1 * DAY, description: 'Scheduled maintenance due — brush replacement', _demo: true },
];

// ── Demo Maintenance Tasks ──────────────────────────────────

export const DEMO_TASKS = [
  {
    id: 'task-001',
    robotId: 'SCR-003',
    type: 'maintenance',
    title: 'Critical — Battery and sensor check',
    description: 'Robot offline with critical vibration readings. Inspect battery, motor, and obstacle sensor.',
    priority: TASK_PRIORITY.CRITICAL,
    status: TASK_STATUS.PENDING,
    assignedPartner: 'part-002',
    assignedPartnerName: 'RoboClean Services',
    customerId: 'cust-002',
    dueDate: NOW + 1 * DAY,
    createdAt: NOW - 2 * HOUR,
    completedAt: null,
    notes: '',
    _demo: true,
  },
  {
    id: 'task-002',
    robotId: 'SCR-002',
    type: 'maintenance',
    title: 'Brush system replacement',
    description: 'Scheduled brush replacement after 500 cleaning cycles.',
    priority: TASK_PRIORITY.MEDIUM,
    status: TASK_STATUS.SCHEDULED,
    assignedPartner: 'part-001',
    assignedPartnerName: 'SolarTech Solutions',
    customerId: 'cust-001',
    dueDate: NOW + 3 * DAY,
    createdAt: NOW - 1 * DAY,
    completedAt: null,
    notes: '',
    _demo: true,
  },
  {
    id: 'task-003',
    robotId: 'SCR-001',
    type: 'maintenance',
    title: 'Water tank refill and filter check',
    description: 'Routine water system maintenance.',
    priority: TASK_PRIORITY.LOW,
    status: TASK_STATUS.COMPLETED,
    assignedPartner: 'part-001',
    assignedPartnerName: 'SolarTech Solutions',
    customerId: 'cust-001',
    dueDate: NOW - 2 * DAY,
    createdAt: NOW - 5 * DAY,
    completedAt: NOW - 2 * DAY,
    notes: 'Filter replaced. Water tank flushed and refilled.',
    _demo: true,
  },
];

// ── Demo Setup Jobs ─────────────────────────────────────────

export const DEMO_SETUP_JOBS = [
  {
    id: 'job-001',
    robotId: 'SCR-005',
    type: 'installation',
    title: 'New installation — Nagpur Tech Park',
    description: 'Install SCR-005 at carport solar array. Conduct site survey and commissioning.',
    status: TASK_STATUS.PENDING,
    assignedPartner: 'part-001',
    assignedPartnerName: 'SolarTech Solutions',
    customerId: 'cust-003',
    customerName: 'Vidarbha Renewables Co.',
    siteName: 'Nagpur Tech Park — Carport Array',
    scheduledDate: NOW + 5 * DAY,
    createdAt: NOW - 1 * DAY,
    completedAt: null,
    survey: {
      panelType: null,
      panelTilt: null,
      panelCount: null,
      accessibility: null,
      notes: '',
    },
    checklist: {
      siteSurveyed: false,
      panelsMeasured: false,
      trackInstalled: false,
      robotMounted: false,
      waterConnected: false,
      powerConnected: false,
      firmwareUpdated: false,
      testCleaningDone: false,
      customerSignoff: false,
    },
    _demo: true,
  },
];

// ── Access helpers ──────────────────────────────────────────

export function getDemoRobotsForCustomer(customerId) {
  return DEMO_ROBOTS.filter(r => r.customerId === customerId);
}

export function getDemoRobotsForPartner(partnerId) {
  return DEMO_ROBOTS.filter(r => r.partnerId === partnerId);
}
