import { createSidebarNav, createDemoBanner, createStatCard, createStatusBadge, ICONS } from '@sasya/shared-ui';
import { DEMO_USERS, DEMO_ROBOTS, DEMO_TASKS, DEMO_SETUP_JOBS, USER_ROLES, getDemoRobotsForCustomer, getDemoRobotsForPartner, formatRelativeTime, formatTelemetryValue } from '@sasya/domain-models';
import { getDemoUser, signInDemo, signOutDemo } from '@sasya/auth-service';
import { createTelemetryService } from '@sasya/telemetry-service';
import { createFirebaseUser, getCurrentFirebaseUser, getDataMode, getDatabase, getFirebaseApp, signInWithFirebase, signOutFirebase } from '@sasya/firebase-client';
import { uploadImage } from '@sasya/cloudinary-client';

const labels = { customer: 'Customer Portal', partner: 'Setup Partner Portal', admin: 'SCR Control Hub' };
const LIVE_SENSOR_ROBOT_ID = 'SCR-001';
const SENSOR_UPLOAD_TIMEOUT_MS = 10000;
const navs = {
  customer: [{ icon:'dashboard', label:'Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'My Robots', id:'robots', href:'/#robots' }, { icon:'clipboard', label:'History & Maintenance', id:'history', href:'/#history' }, { icon:'user', label:'Profile', id:'profile', href:'/#profile' }],
  partner: [{ icon:'dashboard', label:'Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'Assigned Robots', id:'robots', href:'/#robots' }, { icon:'wrench', label:'Setup & Maintenance', id:'work', href:'/#work' }, { icon:'user', label:'Profile', id:'profile', href:'/#profile' }],
  admin: [{ icon:'dashboard', label:'Fleet Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'Robots', id:'robots', href:'/#robots' }, { icon:'users', label:'People & Assignments', id:'people', href:'/#people' }]
};

function roleData(role) {
  const user = getDemoUser(role);
  if (role === USER_ROLES.CUSTOMER) return { user, robots: getDemoRobotsForCustomer(user.uid), tasks: DEMO_TASKS };
  if (role === USER_ROLES.PARTNER) return { user, robots: getDemoRobotsForPartner(user.uid), tasks: [...DEMO_TASKS, ...DEMO_SETUP_JOBS] };
  return { user, robots: DEMO_ROBOTS, tasks: [...DEMO_TASKS, ...DEMO_SETUP_JOBS], people: DEMO_USERS.filter((person) => person.role !== USER_ROLES.ADMIN) };
}

async function getLiveAdminData() {
  const database = await getDatabase();
  const currentUser = await getCurrentFirebaseUser();
  if (!database || !currentUser) throw new Error('The Firebase session is not available. Sign in again.');

  const { get, ref } = await import('firebase/database');
  const [robotsSnapshot, latestSnapshot, profilesSnapshot, rolesSnapshot, customerAccessSnapshot, partnerAccessSnapshot] = await Promise.all([
    get(ref(database, 'robots')),
    get(ref(database, 'robotLatest')),
    get(ref(database, 'userProfiles')),
    get(ref(database, 'userRoles')),
    get(ref(database, 'customerRobotAccess')),
    get(ref(database, 'partnerRobotAccess')),
  ]);
  const latestRobots = latestSnapshot.val() || {};
  const robots = Object.values(robotsSnapshot.val() || {}).map((robot) => ({
    ...robot,
    id: robot.robotId,
    latestTelemetry: latestRobots[robot.robotId] || null,
  }));
  const profiles = profilesSnapshot.val() || {};
  const roles = rolesSnapshot.val() || {};
  const customerAccess = customerAccessSnapshot.val() || {};
  const partnerAccess = partnerAccessSnapshot.val() || {};
  const people = Object.keys({ ...profiles, ...roles }).map((uid) => ({
    ...(profiles[uid] || {}),
    uid,
    role: roles[uid] || profiles[uid]?.role || 'pending',
    assignedRobots: Object.entries(roles[uid] === USER_ROLES.PARTNER ? (partnerAccess[uid] || {}) : (customerAccess[uid] || {}))
      .filter(([, allowed]) => allowed === true || typeof allowed === 'string')
      .map(([robotId]) => robotId),
  })).filter((person) => person.role === USER_ROLES.CUSTOMER || person.role === USER_ROLES.PARTNER);
  const peopleByRobot = {};
  people.forEach((person) => (person.assignedRobots || []).forEach((robotId) => {
    if (!peopleByRobot[robotId]) peopleByRobot[robotId] = { customers: [], partners: [] };
    peopleByRobot[robotId][person.role === USER_ROLES.PARTNER ? 'partners' : 'customers'].push(person);
  }));
  return {
    user: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email || 'Admin',
      role: USER_ROLES.ADMIN,
    },
    robots: robots.map((robot) => ({
      ...robot,
      assignedCustomers: peopleByRobot[robot.robotId]?.customers || [],
      assignedPartners: peopleByRobot[robot.robotId]?.partners || [],
    })),
    tasks: [],
    people,
  };
}

async function getLiveSensorData() {
  const database = await getDatabase();
  const currentUser = await getCurrentFirebaseUser();
  if (!database || !currentUser) throw new Error('The Firebase session is not available. Sign in again.');

  const { get, ref } = await import('firebase/database');
  const snapshot = await get(ref(database, 'sensorData'));
  return snapshot.exists() ? snapshot.val() : null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function normalizeSensorData(sensor) {
  if (typeof sensor === 'number') {
    return { device: 'ESP8266', distance_cm: sensor };
  }
  if (!sensor || typeof sensor !== 'object') return null;

  const distance = sensor.distance_cm
    ?? sensor.ultrasonic?.distance_cm
    ?? sensor.distance
    ?? null;
  const temperature = sensor.temperature_c ?? sensor.temperatureC ?? sensor.temperature ?? null;
  const humidity = sensor.humidity_percent ?? sensor.humidityPercent ?? sensor.humidity ?? null;
  const wifiConnected = sensor.wifi_connected
    ?? sensor.wifi_online
    ?? sensor.wifi?.connected
    ?? (typeof sensor.wifi_status === 'string' ? sensor.wifi_status.toLowerCase() === 'connected' || sensor.wifi_status.toLowerCase() === 'online' : null);
  return {
    ...sensor,
    device: sensor.device ?? sensor.device_id ?? 'ESP8266',
    distance_cm: distance,
    temperature_c: temperature,
    humidity_percent: humidity,
    motor_running: sensor.motor_running ?? sensor.motor?.running ?? null,
    motor_state: sensor.motor_state ?? sensor.motor?.state ?? null,
    motor_pwm: sensor.motor_pwm ?? sensor.motor?.pwm ?? null,
    wifi_connected: wifiConnected,
    timestamp: sensor.timestamp ?? sensor.updated_at ?? sensor.last_updated ?? null,
  };
}

function sensorValue(value, suffix = '') {
  return value === null || value === undefined || value === '' ? '--' : `${value}${suffix}`;
}

function selectRobotSensorData(sensorData, robotId) {
  if (!sensorData || typeof sensorData !== 'object') return null;
  const robotData = sensorData[robotId];
  if (robotData && typeof robotData === 'object') return robotData;
  if (sensorData.latest && typeof sensorData.latest === 'object') return sensorData.latest;
  return Object.keys(sensorData).some((key) => key.startsWith('temperature') || key.startsWith('humidity') || key.startsWith('distance'))
    ? sensorData
    : null;
}

function sensorFingerprint(sensor) {
  if (!sensor || typeof sensor !== 'object') return null;
  return [
    sensor.uptime_ms,
    sensor.distance_cm,
    sensor.temperature_c,
    sensor.humidity_percent,
    sensor.motor_running,
    sensor.motor_state,
    sensor.motor_pwm,
  ].join('|');
}

function renderSensorPanel({ role, mode }) {
  const label = role === USER_ROLES.ADMIN ? 'Connectivity Lab' : 'Robot telemetry';
  const description = role === USER_ROLES.ADMIN
    ? `Live reading for ${LIVE_SENSOR_ROBOT_ID} from the ESP8266 payload at Firebase Realtime Database sensorData.`
    : `Live reading from the ESP8266 connected to ${LIVE_SENSOR_ROBOT_ID}.`;
  return `<section class="card dashboard-section ${role === USER_ROLES.ADMIN ? 'admin-page-section' : ''}" id="live-sensor-panel">
    <div class="portal-topbar"><div><span class="eyebrow">Live telemetry · ${LIVE_SENSOR_ROBOT_ID}</span><h2>${label}</h2><p class="muted">${description}</p></div><span id="sensor-status" class="status-badge status-warning">${mode === 'firebase' ? 'Connecting...' : 'Demo mode'}</span></div>
    <div class="stats-grid sensor-stats">
      <div class="stat-card"><div class="stat-card-header">Device</div><div class="stat-card-value" id="sensor-device">--</div></div>
      <div class="stat-card"><div class="stat-card-header">Distance</div><div class="stat-card-value"><span id="sensor-distance">--</span> cm</div></div>
      <div class="stat-card"><div class="stat-card-header">Temperature</div><div class="stat-card-value"><span id="sensor-temperature">--</span> °C</div></div>
      <div class="stat-card"><div class="stat-card-header">Humidity</div><div class="stat-card-value"><span id="sensor-humidity">--</span> %</div></div>
      <div class="stat-card"><div class="stat-card-header">Motor</div><div class="stat-card-value" id="sensor-motor">--</div><div class="stat-card-subtitle" id="sensor-motor-state">State unavailable</div></div>
      <div class="stat-card"><div class="stat-card-header">Motor PWM</div><div class="stat-card-value" id="sensor-pwm">--</div></div>
      <div class="stat-card"><div class="stat-card-header">Wi-Fi</div><div class="stat-card-value" id="sensor-wifi">--</div></div>
      <div class="stat-card"><div class="stat-card-header">Last reading</div><div class="stat-card-value" id="sensor-timestamp">--</div></div>
    </div>
    <div id="sensor-error" class="notice warning" hidden></div>
  </section>`;
}

function subscribeLiveSensorData(content, mode) {
  const getPanel = () => content.querySelector('#live-sensor-panel, #lab');
  if (!getPanel() || mode !== 'firebase') return;

  let firebaseConnected = null;
  let latestSensor = null;
  let sensorReadError = null;
  let lastFingerprint = null;
  let lastFreshPayloadAt = 0;
  let hasReceivedInitialPayload = false;
  const clearSensorValues = () => {
    const panel = getPanel();
    if (!panel) return;
    ['sensor-device', 'sensor-distance', 'sensor-temperature', 'sensor-humidity', 'sensor-motor', 'sensor-pwm', 'sensor-wifi', 'sensor-timestamp']
      .forEach((id) => { panel.querySelector(`#${id}`).textContent = '--'; });
    panel.querySelector('#sensor-motor-state').textContent = 'No recent data';
  };
  const updateStatus = () => {
    const panel = getPanel();
    if (!panel) return;
    const sensorStatus = panel.querySelector('#sensor-status');
    if (sensorReadError) {
      sensorStatus.textContent = 'Unavailable';
      sensorStatus.className = 'status-badge status-offline';
      return;
    }
    const isFresh = latestSensor && lastFreshPayloadAt > 0 && Date.now() - lastFreshPayloadAt <= SENSOR_UPLOAD_TIMEOUT_MS;
    if (firebaseConnected === false || !isFresh) {
      sensorStatus.textContent = hasReceivedInitialPayload ? 'Disconnected' : 'Waiting for ESP8266';
      sensorStatus.className = 'status-badge status-offline';
      if (!isFresh) clearSensorValues();
      return;
    }
    sensorStatus.textContent = 'Connected';
    sensorStatus.className = 'status-badge status-online';
  };
  const updateDashboard = (rawSensor) => {
    const panel = getPanel();
    if (!panel) return;
    const sensorError = panel.querySelector('#sensor-error');
    try {
      const sensor = normalizeSensorData(rawSensor);
      latestSensor = sensor;
      sensorReadError = null;
      if (sensor) {
        const fingerprint = sensorFingerprint(sensor);
        if (!hasReceivedInitialPayload) {
          hasReceivedInitialPayload = true;
          lastFingerprint = fingerprint;
        } else if (fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint;
          lastFreshPayloadAt = Date.now();
        }
        panel.querySelector('#sensor-device').textContent = sensor.device;
        panel.querySelector('#sensor-distance').textContent = sensorValue(sensor.distance_cm);
        panel.querySelector('#sensor-temperature').textContent = sensorValue(sensor.temperature_c);
        panel.querySelector('#sensor-humidity').textContent = sensorValue(sensor.humidity_percent);
        panel.querySelector('#sensor-motor').textContent = sensor.motor_running === null ? '--' : sensor.motor_running ? 'Running' : 'Stopped';
        panel.querySelector('#sensor-motor-state').textContent = sensor.motor_state || 'State unavailable';
        panel.querySelector('#sensor-pwm').textContent = sensorValue(sensor.motor_pwm);
        panel.querySelector('#sensor-wifi').textContent = sensor.wifi_connected === null ? 'Not sent' : sensor.wifi_connected ? 'Online' : 'Offline';
        panel.querySelector('#sensor-timestamp').textContent = sensor.timestamp ? formatRelativeTime(sensor.timestamp) : 'Just now';
        sensorError.hidden = true;
      }
      updateStatus();
    } catch (error) {
      sensorReadError = error;
      sensorError.hidden = false;
      sensorError.textContent = error.message;
      updateStatus();
    }
  };
  const freshnessTimer = window.setInterval(updateStatus, 1000);
  getDatabase().then(async (database) => {
    if (!database || !content.isConnected) return;
    const { onValue, ref } = await import('firebase/database');
    const unsubscribeConnection = onValue(ref(database, '.info/connected'), (snapshot) => {
      if (!content.isConnected) {
        unsubscribeConnection();
        return;
      }
      firebaseConnected = snapshot.val() === true;
      updateStatus();
    });
    const unsubscribe = onValue(ref(database, 'sensorData'), (snapshot) => {
      if (!content.isConnected) {
        unsubscribe();
        return;
      }
      const value = snapshot.exists() ? snapshot.val() : null;
      updateDashboard(selectRobotSensorData(value, LIVE_SENSOR_ROBOT_ID));
    }, (error) => {
      if (!content.isConnected) return;
      sensorReadError = error;
      const panel = getPanel();
      if (!panel) return;
      const sensorError = panel.querySelector('#sensor-error');
      sensorError.hidden = false;
      sensorError.textContent = error.message;
      updateStatus();
    });
  }).catch((error) => {
    sensorReadError = error;
    const panel = getPanel();
    if (!panel) return;
    const sensorError = panel.querySelector('#sensor-error');
    sensorError.hidden = false;
    sensorError.textContent = error.message;
    updateStatus();
  });
  window.addEventListener('beforeunload', () => window.clearInterval(freshnessTimer), { once: true });
}

function renderAdminOverview(content, robots, people) {
  const overview = content.querySelector('#admin-overview');
  if (!overview) return;
  const customers = people.filter((person) => person.role === USER_ROLES.CUSTOMER).length;
  const partners = people.filter((person) => person.role === USER_ROLES.PARTNER).length;
  const online = robots.filter((robot) => ['online', 'cleaning'].includes(robot.status)).length;
  const offline = robots.filter((robot) => robot.status === 'offline').length;
  const unknown = Math.max(robots.length - online - offline, 0);
  const urgent = robots.filter((robot) => robot.status === 'offline' || !robot.latestTelemetry || (robot.latestTelemetry.timestamp && Date.now() - robot.latestTelemetry.timestamp > 15 * 60 * 1000));
  const total = Math.max(robots.length, 1);
  const onlineAngle = Math.round((online / total) * 360);
  const offlineAngle = onlineAngle + Math.round((offline / total) * 360);
  overview.innerHTML = `<div class="grid grid-3 admin-overview-cards">
    <button class="card admin-overview-card" data-admin-target="robots"><span class="eyebrow">Fleet</span><strong>${robots.length}</strong><span class="muted">Robots registered</span></button>
    <button class="card admin-overview-card" data-admin-target="people"><span class="eyebrow">Customers</span><strong>${customers}</strong><span class="muted">Accounts with access</span></button>
    <button class="card admin-overview-card" data-admin-target="people"><span class="eyebrow">Partners</span><strong>${partners}</strong><span class="muted">Setup partners assigned</span></button>
  </div>
  <div class="grid grid-2 admin-overview-lower">
    <section class="card"><div class="section-heading-row"><div><h2>Fleet status</h2><p class="muted">Current status across registered robots.</p></div><button class="text-link" data-admin-target="robots">Open robots</button></div><div class="admin-chart-row"><div class="admin-donut" style="background:conic-gradient(var(--success) 0deg ${onlineAngle}deg, var(--danger) ${onlineAngle}deg ${offlineAngle}deg, var(--warning) ${offlineAngle}deg 360deg)"><div>${robots.length}</div></div><div class="admin-chart-legend"><span><i style="background:var(--success)"></i>Online / cleaning: ${online}</span><span><i style="background:var(--danger)"></i>Offline: ${offline}</span><span><i style="background:var(--warning)"></i>Needs data: ${unknown}</span></div></div></section>
    <section class="card"><div class="section-heading-row"><div><h2>Maintenance attention</h2><p class="muted">Robots that need a closer look.</p></div><button class="text-link" data-admin-target="robots">Review fleet</button></div><div class="admin-alert-list">${urgent.slice(0, 5).map((robot) => `<div class="admin-alert-row"><span class="status-badge status-offline">Urgent</span><div><strong>${escapeHtml(robot.name || robot.robotId)}</strong><span class="muted">${escapeHtml(robot.robotId)} · ${robot.status === 'offline' ? 'Robot offline' : 'Telemetry missing or stale'}</span></div></div>`).join('') || '<div class="empty-state">No urgent maintenance alerts.</div>'}</div></section>
  </div>`;
  overview.querySelectorAll('[data-admin-target]').forEach((button) => button.addEventListener('click', () => content.querySelector(`#sidebar-${button.dataset.adminTarget}`)?.click()));
}

async function getLiveCustomerData() {
  const database = await getDatabase();
  const currentUser = await getCurrentFirebaseUser();
  if (!database || !currentUser) throw new Error('The Firebase session is not available. Sign in again.');

  const { get, ref } = await import('firebase/database');
  const [profileSnapshot, accessSnapshot] = await Promise.all([
    get(ref(database, `userProfiles/${currentUser.uid}`)),
    get(ref(database, `customerRobotAccess/${currentUser.uid}`)),
  ]);
  const profile = profileSnapshot.val() || {};
  const access = accessSnapshot.val() || {};
  const robotIds = Object.entries(access).filter(([, allowed]) => allowed === true || typeof allowed === 'string').map(([robotId]) => robotId);
  const robotSnapshots = await Promise.all(robotIds.map((robotId) => Promise.all([
    get(ref(database, `robots/${robotId}`)),
    get(ref(database, `robotLatest/${robotId}`)),
  ])));
  const robots = robotSnapshots
    .filter(([snapshot]) => snapshot.exists())
    .map(([snapshot, latestSnapshot]) => ({ ...snapshot.val(), id: snapshot.key, latestTelemetry: latestSnapshot.exists() ? latestSnapshot.val() : null }));

  return {
    user: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: profile.displayName || currentUser.displayName || currentUser.email || 'Customer',
      role: USER_ROLES.CUSTOMER,
    },
    robots,
    tasks: [],
  };
}

async function getLivePartnerData() {
  const database = await getDatabase();
  const currentUser = await getCurrentFirebaseUser();
  if (!database || !currentUser) throw new Error('The Firebase session is not available. Sign in again.');

  const { get, ref } = await import('firebase/database');
  const [profileSnapshot, accessSnapshot] = await Promise.all([
    get(ref(database, `userProfiles/${currentUser.uid}`)),
    get(ref(database, `partnerRobotAccess/${currentUser.uid}`)),
  ]);
  const profile = profileSnapshot.val() || {};
  const robotIds = Object.entries(accessSnapshot.val() || {}).filter(([, allowed]) => allowed === true || typeof allowed === 'string').map(([robotId]) => robotId);
  const robotSnapshots = await Promise.all(robotIds.map((robotId) => Promise.all([
    get(ref(database, `robots/${robotId}`)),
    get(ref(database, `robotLatest/${robotId}`)),
  ])));
  const robots = robotSnapshots
    .filter(([snapshot]) => snapshot.exists())
    .map(([snapshot, latestSnapshot]) => ({ ...snapshot.val(), id: snapshot.key, latestTelemetry: latestSnapshot.exists() ? latestSnapshot.val() : null }));

  return {
    user: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: profile.displayName || currentUser.displayName || currentUser.email || 'Partner',
      role: USER_ROLES.PARTNER,
    },
    robots,
    tasks: [],
  };
}

function robotRow(robot) {
  const telemetry = robot.latestTelemetry;
  const status = telemetry?.status || robot.status;
  return `<tr><td><strong>${robot.robotId}</strong><br><span class="muted">${robot.name}</span></td><td>${robot.installationSite}</td><td>${createStatusBadge(status)?.outerHTML || status}</td><td>${formatTelemetryValue(telemetry?.batteryPercent, '%')}</td><td>${telemetry?.timestamp ? formatRelativeTime(telemetry.timestamp) : 'No data'}</td></tr>`;
}

function adminRobotRow(robot) {
  return `<tr><td><strong>${escapeHtml(robot.robotId)}</strong><br><span class="muted">${escapeHtml(robot.name || 'Unnamed robot')}</span></td><td>${escapeHtml(robot.installationSite || 'Site not assigned')}</td><td><button class="btn btn-outline robot-open-button" type="button" data-robot-id="${escapeHtml(robot.robotId)}">View robot</button></td></tr>`;
}

function renderRobotDetail(content, robot, mode) {
  const detail = content.querySelector('#robot-detail');
  if (!robot) return;
  if (!detail) return;
  const telemetry = robot.latestTelemetry || {};
  const customers = robot.assignedCustomers?.map((person) => person.displayName || person.email).join(', ') || 'Unassigned';
  const partners = robot.assignedPartners?.map((person) => person.displayName || person.email).join(', ') || 'Unassigned';
  const configuration = robot.configuration || {};
  const history = robot.history || robot.maintenanceHistory || [];
  detail.innerHTML = `<div class="portal-topbar"><div><span class="eyebrow">Robot details · ${escapeHtml(robot.robotId)}</span><h2>${escapeHtml(robot.name || 'Unnamed robot')}</h2><p class="muted">All identity, setup, operational, connectivity, and maintenance information for this robot.</p></div><button class="btn btn-outline" id="close-robot-detail" type="button">Back to robots</button></div>
    <div class="grid grid-3">
      <div class="card"><span class="profile-label">Robot ID</span><strong>${escapeHtml(robot.robotId)}</strong><span class="muted">${escapeHtml(robot.installationSite || 'Site not assigned')}</span></div>
      <div class="card"><span class="profile-label">Operational status</span><div style="margin-top:10px">${createStatusBadge(telemetry.status || robot.status)?.outerHTML || escapeHtml(robot.status || 'unknown')}</div></div>
      <div class="card"><span class="profile-label">Last registry update</span><strong>${robot.updatedAt ? formatRelativeTime(robot.updatedAt) : robot.createdAt ? formatRelativeTime(robot.createdAt) : 'Not recorded'}</strong></div>
    </div>
    <div class="grid grid-2" style="margin-top:20px">
      <section class="card"><span class="eyebrow">Ownership & setup</span><h2>People assigned</h2><div class="profile-details"><div><span class="profile-label">Customer</span><strong>${escapeHtml(customers)}</strong></div><div><span class="profile-label">Setup partner</span><strong>${escapeHtml(partners)}</strong></div></div></section>
      <section class="card"><span class="eyebrow">Robot configuration</span><h2>Hardware profile</h2><div class="profile-details"><div><span class="profile-label">Model</span><strong>${escapeHtml(configuration.model || robot.model || 'Not recorded')}</strong></div><div><span class="profile-label">Firmware</span><strong>${escapeHtml(configuration.firmwareVersion || robot.firmwareVersion || 'Not recorded')}</strong></div><div><span class="profile-label">Telemetry interval</span><strong>${configuration.telemetryIntervalSeconds ? `${configuration.telemetryIntervalSeconds} seconds` : 'Not recorded'}</strong></div></div></section>
    </div>
    <div style="margin-top:20px">${renderSensorPanel({ role: USER_ROLES.ADMIN, mode })}</div>
    <section class="card" style="margin-top:20px"><span class="eyebrow">History</span><h2>Maintenance & activity</h2><div>${history.length ? history.map((entry) => `<div class="task-row"><strong>${escapeHtml(entry.title || entry.type || 'Robot event')}</strong><span class="muted">${escapeHtml(entry.description || entry.notes || '')}</span><span class="muted">${entry.timestamp ? formatRelativeTime(entry.timestamp) : 'Date not recorded'}</span></div>`).join('') : '<div class="empty-state">No maintenance or activity history recorded for this robot.</div>'}</div></section>`;
  detail.hidden = false;
  detail.style.display = '';
  content.querySelector('#robots').hidden = true;
  content.querySelector('#robots').style.display = 'none';
  content.querySelector('#robot-create')?.setAttribute('hidden', '');
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  content.querySelector('#close-robot-detail').addEventListener('click', () => {
    detail.hidden = true;
    detail.style.display = 'none';
    content.querySelector('#robots').hidden = false;
    content.querySelector('#robots').style.display = '';
    content.querySelector('#robot-create')?.removeAttribute('hidden');
  });
  if (mode === 'firebase') subscribeLiveSensorData(detail, mode);
}

function renderPartnerRequests(content, requests) {
  const container = content.querySelector('#partner-requests-list');
  if (!container) return;
  const pending = requests.filter((request) => request.status === 'pending');
  container.innerHTML = pending.map((request) => `<article class="partner-request-row"><div><span class="eyebrow">New setup request</span><strong>${escapeHtml(request.robotName || request.robotId)}</strong><span class="muted">${escapeHtml(request.robotId)} · ${escapeHtml(request.installationSite || 'Site to be confirmed')}</span>${request.customerName ? `<span class="muted">Customer: ${escapeHtml(request.customerName)}</span>` : ''}</div><button class="btn btn-primary partner-accept-btn" data-request-id="${escapeHtml(request.requestId)}">Accept assignment</button></article>`).join('') || '<div class="empty-state">No new setup requests.</div>';
  container.querySelectorAll('.partner-accept-btn').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Accepting...';
    try {
      const database = await getDatabase();
      const currentUser = await getCurrentFirebaseUser();
      if (!database || !currentUser) throw new Error('Your Firebase session has expired. Sign in again.');
      const { ref, runTransaction, update } = await import('firebase/database');
      const requestRef = ref(database, `setupRequests/${button.dataset.requestId}`);
      const result = await runTransaction(requestRef, (request) => {
        if (!request || request.status !== 'pending') return;
        return { ...request, status: 'accepted', acceptedBy: currentUser.uid, acceptedAt: Date.now() };
      });
      if (!result.committed) throw new Error('Another partner accepted this request first.');
      const acceptedRequest = result.snapshot.val();
      await update(ref(database), { [`partnerRobotAccess/${currentUser.uid}/${acceptedRequest.robotId}`]: acceptedRequest.requestId });
      button.textContent = 'Accepted';
      button.className = 'status-badge status-online';
      button.closest('.partner-request-row').querySelector('.eyebrow').textContent = 'Assignment accepted';
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Accept assignment';
      window.alert(error.message);
    }
  }));
}

function login(app, role, mode) {
  const demoMode = mode !== 'firebase';
  app.innerHTML = `<main class="section"><div class="container" style="max-width:500px"><div class="card"><span class="eyebrow">${labels[role]}</span><h1>Sign in</h1><p class="muted">${demoMode ? 'Demo mode is active.' : 'Sign in with your Sasya production account.'}</p><form id="login-form"><div class="field"><label for="email">Email</label><input id="email" type="email" ${demoMode ? `value="${getDemoUser(role).email}"` : ''} required></div><div class="field" style="margin-top:14px"><label for="password">Password</label><input id="password" type="password" required></div><button class="btn btn-primary" style="margin-top:18px">${demoMode ? 'Continue in demo mode' : 'Sign in'}</button><div id="login-error" class="notice warning" hidden></div></form></div></div></main>`;
  app.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const email = app.querySelector('#email').value;
      const password = app.querySelector('#password').value;
      if (demoMode) {
        await signInDemo({ email, role });
      } else {
        const result = await signInWithFirebase(email, password);
        if (result.role !== role) {
          await signOutFirebase();
          throw new Error(`This account is assigned to the ${result.role} portal.`);
        }
      }
      sessionStorage.setItem(`sasya-${role}-signed-in`, 'true');
      renderPortal(app, role, mode);
    }
    catch (error) { const output = app.querySelector('#login-error'); output.hidden = false; output.textContent = error.message; }
  });
}

function getCustomerPage() {
  const page = window.location.hash.slice(1);
  return ['dashboard', 'robots', 'history', 'profile'].includes(page) ? page : 'dashboard';
}

function renderCustomerPage(content, page, { user, robots, tasks }, mode, liveDataError) {
  const counts = {
    total: robots.length,
    online: robots.filter((robot) => ['online', 'cleaning'].includes(robot.status)).length,
    offline: robots.filter((robot) => robot.status === 'offline').length,
    unknown: robots.filter((robot) => robot.status === 'unknown').length,
  };
  const heading = {
    dashboard: `Welcome, ${user.name.split(' ')[0]}`,
    robots: 'My robots',
    history: 'History & maintenance',
    profile: 'My profile',
  }[page];
  const pageIntro = {
    dashboard: 'A quick overview of your assigned cleaning robots.',
    robots: 'Monitor the current situation of every robot assigned to your account.',
    history: 'Review maintenance assignments and recent operational alerts.',
    profile: 'Manage and review your customer account details.',
  }[page];

  content.innerHTML = `<div class="portal-topbar"><div><span class="eyebrow">Customer Portal</span><h1>${heading}</h1><p class="page-intro">${pageIntro}</p></div><span class="data-mode-pill ${mode === 'firebase' ? 'is-live' : ''}">${mode === 'firebase' ? 'Live Firebase data' : 'Demo data'}</span></div>
    ${liveDataError ? `<div class="notice warning">${liveDataError}</div>` : ''}
    ${page === 'dashboard' ? `
      <div class="stats-grid" id="stats"></div>
      <div class="grid grid-2 customer-dashboard-cards">
        <section class="card"><div class="section-heading-row"><div><h2>Robot health</h2><p class="muted">Your assigned fleet at a glance.</p></div><a class="text-link" href="#robots">View all robots</a></div><div class="dashboard-robot-list">${robots.slice(0, 3).map((robot) => `<div class="dashboard-robot-row"><div><strong>${robot.robotId}</strong><span class="muted">${robot.name}</span></div>${createStatusBadge(robot.status).outerHTML}</div>`).join('') || '<div class="empty-state">No robots assigned.</div>'}</div></section>
        <section class="card"><div class="section-heading-row"><div><h2>Maintenance attention</h2><p class="muted">Items that may need your attention.</p></div><a class="text-link" href="#history">View history</a></div><div id="dashboard-task-list"></div></section>
      </div>
      ${renderSensorPanel({ role: USER_ROLES.CUSTOMER, mode })}` : ''}
    ${page === 'robots' ? `
      <section class="card"><div class="portal-topbar"><div><h2>Robot situation</h2><p class="muted">Live status, battery and last update for your robots.</p></div><label class="search-field">${ICONS.search}<input id="robot-filter" placeholder="Search robots" aria-label="Search robots"></label></div><div class="table-wrap"><table><thead><tr><th>Robot</th><th>Site</th><th>Status</th><th>Battery</th><th>Last update</th></tr></thead><tbody id="robot-table"></tbody></table></div></section>` : ''}
    ${page === 'history' ? `
      <section class="card"><h2>Maintenance & alerts</h2><p class="muted">A record of maintenance work and operational events for your account.</p><div id="task-list"></div></section>
      <section class="card history-note"><h2>Need help?</h2><p class="muted">Contact your assigned service partner if a robot needs inspection or maintenance.</p></section>` : ''}
    ${page === 'profile' ? `
      <section class="card profile-page"><div class="profile-page-heading"><div class="profile-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div><div><h2>${user.name}</h2><p class="muted">Customer account</p></div></div><div class="profile-details"><div><span class="profile-label">Name</span><strong>${user.name}</strong></div><div><span class="profile-label">Email</span><strong>${user.email}</strong></div><div><span class="profile-label">Role</span><strong>Customer</strong></div></div></section>` : ''}`;

  if (page === 'dashboard') {
    const stats = content.querySelector('#stats');
    [['robot', 'Robots', counts.total], ['signal', 'Online / active', counts.online], ['alert', 'Offline', counts.offline], ['dashboard', 'Unknown', counts.unknown]].forEach(([icon, label, value]) => stats.append(createStatCard({ icon: `<span>${icon}</span>`, label, value, subtitle: mode === 'firebase' ? 'From Firebase records' : 'From demo records' })));
    content.querySelector('#dashboard-task-list').innerHTML = tasks.slice(0, 3).map((task) => `<div class="task-row"><strong>${task.title || task.name}</strong><span class="muted">${task.description || task.site || 'Operational record'}</span>${createStatusBadge(task.status).outerHTML}</div>`).join('') || '<div class="empty-state">No current assignments.</div>';
  }
  if (page === 'robots') {
    const table = content.querySelector('#robot-table');
    const drawRows = (query = '') => { table.innerHTML = robots.filter((robot) => `${robot.robotId} ${robot.name} ${robot.installationSite}`.toLowerCase().includes(query.toLowerCase())).map(robotRow).join('') || '<tr><td colspan="5" class="empty-state">No robots match this search.</td></tr>'; };
    drawRows();
    content.querySelector('#robot-filter').addEventListener('input', (event) => drawRows(event.target.value));
  }
  if (page === 'history') {
    content.querySelector('#task-list').innerHTML = tasks.map((task) => `<div class="task-row"><strong>${task.title || task.name}</strong><span class="muted">${task.description || task.site || 'Operational record'}</span>${createStatusBadge(task.status).outerHTML}</div>`).join('') || '<div class="empty-state">No maintenance records.</div>';
  }
}

async function renderPortal(app, role, mode) {
  let data = roleData(role);
  let liveDataError = '';
  if (role === USER_ROLES.ADMIN && mode === 'firebase') {
    try {
      data = await getLiveAdminData();
    } catch (error) {
      liveDataError = error.message;
    }
  }
  if (role === USER_ROLES.CUSTOMER && mode === 'firebase') {
    try {
      data = await getLiveCustomerData();
    } catch (error) {
      liveDataError = error.message;
    }
  }
  if (role === USER_ROLES.PARTNER && mode === 'firebase') {
    try {
      data = await getLivePartnerData();
    } catch (error) {
      liveDataError = error.message;
    }
  }
  const { user, robots, tasks, people = [] } = data;
  const counts = { total:robots.length, online:robots.filter((r) => ['online','cleaning'].includes(r.status)).length, offline:robots.filter((r) => r.status === 'offline').length, unknown:robots.filter((r) => r.status === 'unknown').length };
  const currentPage = role === USER_ROLES.CUSTOMER ? getCustomerPage() : 'dashboard';
  const sidebar = createSidebarNav({ portalName:labels[role], navItems:navs[role], currentPage, user, onSignOut: async () => { if (mode === 'firebase') await signOutFirebase(); else await signOutDemo(); sessionStorage.removeItem(`sasya-${role}-signed-in`); login(app, role, mode); } });
  const shell = document.createElement('div'); shell.className = 'portal-shell';
  const main = document.createElement('div'); main.className = 'portal-main';
  if (mode !== 'firebase') main.append(createDemoBanner());
  const content = document.createElement('main'); content.className = 'portal-content';
  if (role === USER_ROLES.CUSTOMER) {
    renderCustomerPage(content, currentPage, data, mode, liveDataError);
    navs.customer.forEach((item) => {
      const link = sidebar.querySelector(`#sidebar-${item.id}`);
      link?.addEventListener('click', (event) => {
        event.preventDefault();
        window.history.replaceState(null, '', item.id === 'dashboard' ? window.location.pathname : `#${item.id}`);
        sidebar.querySelectorAll('.sidebar-menu-link').forEach((navLink) => navLink.classList.toggle('active', navLink === link));
        renderCustomerPage(content, item.id, data, mode, liveDataError);
      });
    });
    main.append(content);
    shell.append(sidebar, main);
    app.replaceChildren(shell);
    if (mode === 'firebase') subscribeLiveSensorData(content, mode);
    return;
  }
  content.innerHTML = `<div class="portal-topbar admin-dashboard-header"><div><span class="eyebrow">${labels[role]}</span><h1>${role === 'admin' ? 'Fleet overview' : `Welcome, ${user.name.split(' ')[0]}`}</h1></div><span class="data-mode-pill ${mode === 'firebase' ? 'is-live' : ''}">${mode === 'firebase' ? 'Live Firebase data' : 'Demo data'}</span></div>
    ${liveDataError ? `<div class="notice warning">${liveDataError}</div>` : ''}
    <div class="stats-grid admin-dashboard-summary" id="stats"></div>
    ${role === 'partner' ? '<section class="card partner-requests dashboard-section partner-page-section" id="partner-requests"><div class="section-heading-row"><div><span class="eyebrow">Work queue</span><h2>New setup requests</h2><p class="muted">The first available partner to accept a request receives the assignment.</p></div><span class="data-mode-pill is-live">Live notifications</span></div><div id="partner-requests-list"><div class="empty-state">Waiting for new requests.</div></div></section>' : ''}
    ${role === 'admin' ? '<section class="admin-overview dashboard-section" id="admin-overview"></section>' : ''}
    <section class="card dashboard-section admin-page-section partner-page-section" id="robots"><div class="portal-topbar"><div><span class="eyebrow">Robot registry</span><h2>${role === 'partner' ? 'Assigned robots' : 'Robots'}</h2><p class="muted">Open a robot to see its complete profile and live information.</p></div><label class="search-field">${ICONS.search}<input id="robot-filter" placeholder="Search robots" aria-label="Search robots"></label></div><div class="table-wrap"><table><thead><tr><th>Robot</th><th>Installation site</th><th>Details</th></tr></thead><tbody id="robot-table"></tbody></table></div></section>
    <section class="card dashboard-section admin-page-section partner-page-section" id="robot-detail" hidden></section>
    <div class="grid grid-2 dashboard-section admin-page-section partner-page-section" id="${role === 'partner' ? 'work' : 'history'}"><section class="card"><h2>${role === 'customer' ? 'Maintenance & alerts' : role === 'partner' ? 'Assigned work' : 'Recent alerts'}</h2><div id="task-list"></div></section><section class="card"><h2>Connectivity status</h2><div class="notice warning"><strong>${mode === 'firebase' ? 'Firebase connected.' : 'Demo mode.'}</strong> Device connectivity depends on the ESP32 writing validated telemetry records.</div><p class="muted" style="margin-top:14px">Remote start, stop, movement, and cleaning commands are unavailable until a safe command protocol is confirmed.</p></section></div>
    ${role === 'customer' || role === 'partner' ? `<section class="card dashboard-section ${role === 'partner' ? 'partner-page-section' : ''} profile-section" id="profile"><div><span class="eyebrow">Account</span><h2>Your profile</h2><p class="muted">${role === 'partner' ? 'Review your setup partner account and assigned work access.' : 'Customer access is scoped to the robots assigned to your account.'}</p></div><div class="profile-details"><div><span class="profile-label">Name</span><strong>${escapeHtml(user.name)}</strong></div><div><span class="profile-label">Email</span><strong>${escapeHtml(user.email)}</strong></div><div><span class="profile-label">Role</span><strong>${role === 'partner' ? 'Setup partner' : 'Customer'}</strong></div></div></section>` : ''}
    ${role === 'admin' && mode === 'firebase' ? `<section class="card dashboard-section admin-page-section" id="people" style="margin-top:20px"><div class="portal-topbar"><div><span class="eyebrow">Accounts and access</span><h2>People & assignments</h2><p class="muted">Create a Firebase login, save the person profile, and assign robot access.</p></div><span class="data-mode-pill">Authentication enabled</span></div>
      <div class="grid grid-2">
        <form id="person-create-form" class="card"><h3>Create login and profile</h3><p class="muted">The person receives a Firebase Authentication account and can sign in to the customer or partner portal.</p><div class="field"><label for="person-role">Role</label><select id="person-role"><option value="customer">Customer</option><option value="partner">Partner</option></select></div><div class="field"><label for="person-name">Full name</label><input id="person-name" required></div><div class="field"><label for="person-email">Email</label><input id="person-email" type="email" required></div><div class="field"><label for="person-password">Temporary password</label><input id="person-password" type="password" minlength="6" required></div><div class="field"><label for="person-company">Company</label><input id="person-company" required></div><div class="field"><label for="person-phone">Mobile number</label><input id="person-phone" type="tel" required></div><div class="field"><label for="person-robots">Assign robots now</label><select id="person-robots" multiple size="5">${robots.map((robot) => `<option value="${escapeHtml(robot.robotId)}">${escapeHtml(robot.robotId)} — ${escapeHtml(robot.name)}</option>`).join('')}</select></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Create account</button><div id="person-create-status" class="notice" hidden style="margin-top:14px"></div></form>
        <form id="assignment-form" class="card"><h3>Assign robots</h3><p class="muted">Assignments control which robots the selected person can access.</p><div class="field"><label for="assignment-person">Customer or partner</label><select id="assignment-person" required><option value="">Select a person</option>${people.map((person) => `<option value="${escapeHtml(person.uid)}">${escapeHtml(person.displayName || person.name || person.email || person.uid)} — ${escapeHtml(person.role)}</option>`).join('')}</select></div><div class="field"><label for="assignment-robots">Robots</label><select id="assignment-robots" multiple size="6">${robots.map((robot) => `<option value="${escapeHtml(robot.robotId)}">${escapeHtml(robot.robotId)} — ${escapeHtml(robot.name)}</option>`).join('')}</select></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Save assignments</button><div id="assignment-status" class="notice" hidden style="margin-top:14px"></div></form>
        <form id="setup-request-form" class="card"><h3>Send setup request</h3><p class="muted">Notify every partner. The first partner to accept receives the robot assignment.</p><div class="field"><label for="request-robot">Robot</label><select id="request-robot" required><option value="">Select a robot</option>${robots.map((robot) => `<option value="${escapeHtml(robot.robotId)}">${escapeHtml(robot.robotId)} — ${escapeHtml(robot.name)}</option>`).join('')}</select></div><div class="field"><label for="request-customer">Customer</label><select id="request-customer"><option value="">No customer selected</option>${people.filter((person) => person.role === USER_ROLES.CUSTOMER).map((person) => `<option value="${escapeHtml(person.uid)}">${escapeHtml(person.displayName || person.email)}</option>`).join('')}</select></div><div class="field"><label for="request-notes">Setup notes</label><textarea id="request-notes" placeholder="Site details or setup requirements"></textarea></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Notify partners</button><div id="setup-request-status" class="notice" hidden style="margin-top:14px"></div></form>
      </div>
      <div class="table-wrap" style="margin-top:20px"><table><thead><tr><th>Person</th><th>Role</th><th>Company</th><th>Assigned robots</th><th>Status</th></tr></thead><tbody>${people.map((person) => `<tr><td><strong>${escapeHtml(person.displayName || person.name || 'Unnamed')}</strong><br><span class="muted">${escapeHtml(person.email)}</span></td><td>${escapeHtml(person.role)}</td><td>${escapeHtml(person.company || '—')}</td><td>${escapeHtml(person.assignedRobots?.join(', ') || 'None')}</td><td><span class="status-badge status-warning">Pending activation</span></td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">No customer or partner profiles yet.</td></tr>'}</tbody></table></div>
    </section><section class="card dashboard-section admin-page-section" id="robot-create" style="margin-top:20px"><h2>Create robot</h2><p class="muted">Register the robot identity and real hardware configuration before connecting its ESP32.</p><form id="robot-create-form"><div class="grid grid-2"><div class="field"><label for="robot-id">Robot ID</label><input id="robot-id" value="SCR-${String(robots.length + 1).padStart(3, '0')}" pattern="[A-Za-z0-9_\\-]+" required></div><div class="field"><label for="robot-name">Robot name</label><input id="robot-name" value="Sasya Cleaning Robot ${robots.length + 1}" required></div><div class="field"><label for="installation-site">Installation site</label><input id="installation-site" value="Not assigned" required></div><div class="field"><label for="robot-customer">Assign customer</label><select id="robot-customer"><option value="">No customer yet</option>${people.filter((person) => person.role === USER_ROLES.CUSTOMER).map((person) => `<option value="${escapeHtml(person.uid)}">${escapeHtml(person.displayName || person.email)}</option>`).join('')}</select></div><div class="field"><label for="robot-partner">Assign setup partner</label><select id="robot-partner"><option value="">No partner yet</option>${people.filter((person) => person.role === USER_ROLES.PARTNER).map((person) => `<option value="${escapeHtml(person.uid)}">${escapeHtml(person.displayName || person.email)}</option>`).join('')}</select></div><div class="field"><label for="robot-model">Model</label><input id="robot-model" value="SCR" required></div><div class="field"><label for="firmware-version">Firmware version</label><input id="firmware-version" value="not-installed" required></div><div class="field"><label for="telemetry-interval">Telemetry interval (seconds)</label><input id="telemetry-interval" type="number" min="5" value="60" required></div><div class="field"><label for="battery-capacity">Battery capacity (%)</label><input id="battery-capacity" type="number" min="1" max="100" value="100" required></div><div class="field"><label for="water-capacity">Water tank capacity (litres)</label><input id="water-capacity" type="number" min="0" value="0" required></div><div class="field"><label for="robot-image">Robot image</label><input id="robot-image" type="file" accept="image/jpeg,image/png,image/webp"></div></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Create robot</button><div id="robot-create-status" class="notice" hidden style="margin-top:14px"></div></form></section>` : ''}`;
  const stats = content.querySelector('#stats');
  [['robot', 'Robots', counts.total], ['signal', 'Online / active', counts.online], ['alert', 'Offline', counts.offline], ['dashboard', 'Unknown', counts.unknown]].forEach(([icon,label,value]) => stats.append(createStatCard({ icon: `<span>${icon}</span>`, label, value, subtitle: mode === 'firebase' ? 'Calculated from Firebase records' : 'Calculated from demo records' })));
  if (role === USER_ROLES.ADMIN) renderAdminOverview(content, robots, people);
  const table = content.querySelector('#robot-table');
  const drawRows = (query = '') => {
    table.innerHTML = robots.filter((robot) => `${robot.robotId} ${robot.name} ${robot.installationSite}`.toLowerCase().includes(query.toLowerCase())).map(role === USER_ROLES.ADMIN ? adminRobotRow : robotRow).join('') || `<tr><td colspan="${role === USER_ROLES.ADMIN ? '3' : '5'}" class="empty-state">No robots match this search.</td></tr>`;
    if (role === USER_ROLES.ADMIN) {
      table.querySelectorAll('.robot-open-button').forEach((button) => {
        button.addEventListener('click', () => renderRobotDetail(content, robots.find((robot) => robot.robotId === button.dataset.robotId), mode));
      });
    }
  };
  drawRows(); content.querySelector('#robot-filter').addEventListener('input', (event) => drawRows(event.target.value));
  if (mode === 'firebase') {
    getDatabase().then(async (database) => {
      if (!database) return;
      const { onValue, ref } = await import('firebase/database');
      const telemetryPath = role === USER_ROLES.ADMIN ? 'robotLatest' : null;
      if (telemetryPath) {
        const unsubscribe = onValue(ref(database, telemetryPath), (snapshot) => {
          if (!content.isConnected) {
            unsubscribe();
            return;
          }
          const latestRobots = snapshot.val() || {};
          robots.forEach((robot) => { robot.latestTelemetry = latestRobots[robot.robotId] || null; });
          drawRows(content.querySelector('#robot-filter').value);
          renderAdminOverview(content, robots, people);
        });
      } else {
        robots.forEach((robot) => {
          const unsubscribe = onValue(ref(database, `robotLatest/${robot.robotId}`), (snapshot) => {
            if (!content.isConnected) {
              unsubscribe();
              return;
            }
            robot.latestTelemetry = snapshot.exists() ? snapshot.val() : null;
            drawRows(content.querySelector('#robot-filter').value);
          });
        });
      }
    });
  }
  if (role === USER_ROLES.PARTNER && mode === 'firebase') {
    getDatabase().then(async (database) => {
      const currentUser = await getCurrentFirebaseUser();
      if (!database || !currentUser) return;
      const { onValue, ref } = await import('firebase/database');
      const unsubscribe = onValue(ref(database, `partnerNotifications/${currentUser.uid}`), (snapshot) => {
        if (!content.isConnected) {
          unsubscribe();
          return;
        }
        renderPartnerRequests(content, Object.values(snapshot.val() || {}));
      });
    });
  }
  content.querySelector('#task-list').innerHTML = tasks.slice(0, 5).map((task) => `<div style="padding:12px 0;border-bottom:1px solid var(--border)"><strong>${task.title || task.name}</strong><br><span class="muted">${task.description || task.site || 'Operational record'}</span> ${createStatusBadge(task.status)?.outerHTML || ''}</div>`).join('') || '<div class="empty-state">No current assignments.</div>';
  const showFocusedView = (page) => {
    if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.PARTNER) return;
    const dashboardElements = [content.querySelector('.admin-dashboard-header'), content.querySelector('.admin-dashboard-summary'), content.querySelector('#admin-overview')];
    dashboardElements.forEach((element) => { if (element) element.style.display = page === 'dashboard' ? '' : 'none'; });
    content.querySelectorAll('.admin-page-section, .partner-page-section').forEach((section) => { section.style.display = 'none'; });
    if (role === USER_ROLES.PARTNER && page === 'work') {
      content.querySelector('#partner-requests')?.style.setProperty('display', '');
      content.querySelector('#work')?.style.setProperty('display', '');
    }
    if (page === 'robots') {
      content.querySelector('#robots').style.display = '';
      content.querySelector('#robot-detail').hidden = true;
      content.querySelector('#robot-detail').style.display = 'none';
      if (role === USER_ROLES.ADMIN) content.querySelector('#robot-create')?.style.setProperty('display', '');
    }
    if (role === USER_ROLES.ADMIN && page === 'people') content.querySelector('#people')?.style.setProperty('display', '');
    if (role === USER_ROLES.PARTNER && page === 'profile') content.querySelector('#profile')?.style.setProperty('display', '');
  };
  showFocusedView('dashboard');
  navs[role].forEach((item) => {
    const link = sidebar.querySelector(`#sidebar-${item.id}`);
    link?.addEventListener('click', (event) => {
      if (role === USER_ROLES.ADMIN || role === USER_ROLES.PARTNER) {
        event.preventDefault();
        showFocusedView(item.id);
        sidebar.querySelectorAll('.sidebar-menu-link').forEach((navLink) => navLink.classList.remove('active'));
        link.classList.add('active');
        return;
      }
      const target = item.id === 'dashboard' ? content : content.querySelector(`#${item.id}`);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sidebar.querySelectorAll('.sidebar-menu-link').forEach((navLink) => navLink.classList.remove('active'));
      link.classList.add('active');
    });
  });
  const uploadForm = content.querySelector('#image-upload-form');
  const robotForm = content.querySelector('#robot-create-form');
  if (robotForm) {
    robotForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = content.querySelector('#robot-create-status');
      const robotId = content.querySelector('#robot-id').value.trim();
      status.hidden = false;
      status.className = 'notice';
      status.textContent = 'Creating robot...';
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(robotId)) throw new Error('Robot ID may contain only letters, numbers, hyphens, and underscores.');
        const database = await getDatabase();
        if (!database) throw new Error('Firebase Realtime Database is not configured.');
        const { get, ref, set, update } = await import('firebase/database');
        const robotRef = ref(database, `robots/${robotId}`);
        const existing = await get(robotRef);
        if (existing.exists()) throw new Error(`Robot ${robotId} already exists. Use a different ID.`);
        const imageFile = content.querySelector('#robot-image')?.files[0];
        let image = null;
        if (imageFile) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) throw new Error('Choose a JPG, PNG, or WebP robot image.');
          if (imageFile.size > 10 * 1024 * 1024) throw new Error('Robot image must be 10 MB or smaller.');
          image = await uploadImage(imageFile, { folder: `sasya/robots/${robotId}` });
        }
        const robot = {
          robotId,
          name: content.querySelector('#robot-name').value.trim(),
          status: 'offline',
          installationSite: content.querySelector('#installation-site').value.trim(),
          createdAt: Date.now(),
          configuration: {
            model: content.querySelector('#robot-model').value.trim(),
            firmwareVersion: content.querySelector('#firmware-version').value.trim(),
            telemetryIntervalSeconds: Number(content.querySelector('#telemetry-interval').value),
            batteryCapacityPercent: Number(content.querySelector('#battery-capacity').value),
            waterTankCapacityLitres: Number(content.querySelector('#water-capacity').value),
          },
        };
        if (image) robot.image = { publicId: image.publicId, secureUrl: image.secureUrl };
        await set(robotRef, robot);
        const customerUid = content.querySelector('#robot-customer')?.value;
        const partnerUid = content.querySelector('#robot-partner')?.value;
        const assignments = {};
        if (customerUid) assignments[`customerRobotAccess/${customerUid}/${robotId}`] = true;
        if (partnerUid) assignments[`partnerRobotAccess/${partnerUid}/${robotId}`] = true;
        if (Object.keys(assignments).length) await update(ref(database), assignments);
        status.className = 'notice success';
        status.textContent = `Robot ${robotId} created successfully in Firebase.`;
        robotForm.reset();
      } catch (error) {
        status.className = 'notice warning';
        status.textContent = error.message;
      }
    });
  }
  const personForm = content.querySelector('#person-create-form');
  if (personForm) {
    personForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = content.querySelector('#person-create-status');
      status.hidden = false;
      status.className = 'notice';
      status.textContent = 'Creating profile...';
      try {
        const personRole = content.querySelector('#person-role').value;
        const name = content.querySelector('#person-name').value.trim();
        const email = content.querySelector('#person-email').value.trim();
        const password = content.querySelector('#person-password').value;
        if (password.length < 6) throw new Error('Temporary password must be at least 6 characters.');
        const createdUser = await createFirebaseUser({ email, password, displayName: name });
        const uid = createdUser.uid;
        const database = await getDatabase();
        if (!database) throw new Error('Firebase Realtime Database is not configured.');
        const { get, ref, update } = await import('firebase/database');
        const now = Date.now();
        const profile = {
          uid,
          email,
          displayName: name,
          company: content.querySelector('#person-company').value.trim(),
          phone: content.querySelector('#person-phone').value.trim() || null,
          role: personRole,
          status: 'active',
          createdAt: now,
          createdBy: user.uid,
        };
        const updates = {
          [`userProfiles/${uid}`]: profile,
          [`userRoles/${uid}`]: personRole,
        };
        Array.from(content.querySelector('#person-robots').selectedOptions).forEach((option) => {
          const prefix = personRole === USER_ROLES.PARTNER ? 'partnerRobotAccess' : 'customerRobotAccess';
          updates[`${prefix}/${uid}/${option.value}`] = true;
        });
        await update(ref(database), updates);
        status.className = 'notice success';
        status.textContent = `${personRole === 'customer' ? 'Customer' : 'Partner'} account created. They can now sign in with the email and temporary password.`;
        personForm.reset();
        await renderPortal(app, role, mode);
      } catch (error) {
        status.className = 'notice warning';
        status.textContent = error.message;
      }
    });
  }
  const assignmentForm = content.querySelector('#assignment-form');
  if (assignmentForm) {
    const personSelect = content.querySelector('#assignment-person');
    const robotSelect = content.querySelector('#assignment-robots');
    const syncAssignmentOptions = () => {
      const person = people.find((item) => item.uid === personSelect.value);
      const assigned = new Set(person?.assignedRobots || []);
      Array.from(robotSelect.options).forEach((option) => { option.selected = assigned.has(option.value); });
    };
    personSelect.addEventListener('change', syncAssignmentOptions);
    assignmentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = content.querySelector('#assignment-status');
      status.hidden = false;
      status.className = 'notice';
      status.textContent = 'Saving assignments...';
      try {
        const person = people.find((item) => item.uid === personSelect.value);
        if (!person) throw new Error('Select a customer or partner first.');
        const selectedRobots = new Set(Array.from(robotSelect.selectedOptions).map((option) => option.value));
        const database = await getDatabase();
        if (!database) throw new Error('Firebase Realtime Database is not configured.');
        const { update, ref } = await import('firebase/database');
        const prefix = person.role === USER_ROLES.PARTNER ? 'partnerRobotAccess' : 'customerRobotAccess';
        const updates = {};
        (person.assignedRobots || []).forEach((robotId) => { updates[`${prefix}/${person.uid}/${robotId}`] = null; });
        selectedRobots.forEach((robotId) => { updates[`${prefix}/${person.uid}/${robotId}`] = true; });
        await update(ref(database), updates);
        status.className = 'notice success';
        status.textContent = `Saved ${selectedRobots.size} robot assignment${selectedRobots.size === 1 ? '' : 's'}.`;
        await renderPortal(app, role, mode);
      } catch (error) {
        status.className = 'notice warning';
        status.textContent = error.message;
      }
    });
  }
  const setupRequestForm = content.querySelector('#setup-request-form');
  if (setupRequestForm) {
    setupRequestForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = content.querySelector('#setup-request-status');
      status.hidden = false;
      status.className = 'notice';
      status.textContent = 'Notifying partners...';
      try {
        const robotId = content.querySelector('#request-robot').value;
        const robot = robots.find((item) => item.robotId === robotId);
        const partnerPeople = people.filter((person) => person.role === USER_ROLES.PARTNER);
        if (!robot) throw new Error('Select a robot first.');
        if (!partnerPeople.length) throw new Error('Create at least one setup partner first.');
        const customer = people.find((person) => person.uid === content.querySelector('#request-customer').value);
        const database = await getDatabase();
        if (!database) throw new Error('Firebase Realtime Database is not configured.');
        const { push, ref, update } = await import('firebase/database');
        const requestRef = push(ref(database, 'setupRequests'));
        const request = {
          requestId: requestRef.key,
          robotId: robot.robotId,
          robotName: robot.name,
          installationSite: robot.installationSite,
          customerUid: customer?.uid || null,
          customerName: customer?.displayName || customer?.email || null,
          notes: content.querySelector('#request-notes').value.trim() || null,
          status: 'pending',
          createdAt: Date.now(),
          createdBy: user.uid,
        };
        const updates = { [`setupRequests/${requestRef.key}`]: request };
        partnerPeople.forEach((partner) => { updates[`partnerNotifications/${partner.uid}/${requestRef.key}`] = request; });
        await update(ref(database), updates);
        status.className = 'notice success';
        status.textContent = `Setup request sent to ${partnerPeople.length} partner${partnerPeople.length === 1 ? '' : 's'}.`;
        setupRequestForm.reset();
      } catch (error) {
        status.className = 'notice warning';
        status.textContent = error.message;
      }
    });
  }
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = content.querySelector('#image-upload-status');
      const file = content.querySelector('#image-file').files[0];
      status.hidden = false;
      status.textContent = 'Uploading image...';
      try {
        if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
        if (file.size > 10 * 1024 * 1024) throw new Error('Image must be 10 MB or smaller.');
        const result = await uploadImage(file, { folder: 'sasya/admin' });
        const currentUser = await getCurrentFirebaseUser();
        if (!currentUser) throw new Error('Your Firebase session has expired. Sign in again and retry the upload.');
        const database = await getDatabase();
        if (!database) throw new Error('Firebase Realtime Database is not configured.');
        const { push, ref, set } = await import('firebase/database');
        const recordRef = push(ref(database, `mediaUploads/${currentUser.uid}`));
        await set(recordRef, { ...result, fileName: file.name, uploadedBy: currentUser.uid, uploadedAt: Date.now() });
        status.textContent = `Uploaded successfully: ${result.secureUrl}`;
        status.className = 'notice success';
        uploadForm.reset();
      } catch (error) {
        status.textContent = error.message;
        status.className = 'notice warning';
      }
    });
  }
  main.append(content); shell.append(sidebar, main); app.replaceChildren(shell);
}

export async function startPortal(app, role) {
  const mode = getDataMode();
  if (sessionStorage.getItem(`sasya-${role}-signed-in`) === 'true') renderPortal(app, role, mode); else login(app, role, mode);
  const firebaseApp = mode === 'firebase' ? await getFirebaseApp() : null;
  const service = createTelemetryService({ mode, firebaseApp });
  service.dispose();
}
