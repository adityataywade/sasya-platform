import { createSidebarNav, createDemoBanner, createStatCard, createStatusBadge } from '@sasya/shared-ui';
import { DEMO_USERS, DEMO_ROBOTS, DEMO_TASKS, DEMO_SETUP_JOBS, USER_ROLES, getDemoRobotsForCustomer, getDemoRobotsForPartner, formatRelativeTime, formatTelemetryValue } from '@sasya/domain-models';
import { getDemoUser, signInDemo, signOutDemo } from '@sasya/auth-service';
import { createTelemetryService } from '@sasya/telemetry-service';
import { getCurrentFirebaseUser, getDataMode, getDatabase, getFirebaseApp, signInWithFirebase, signOutFirebase } from '@sasya/firebase-client';
import { uploadImage } from '@sasya/cloudinary-client';

const labels = { customer: 'Customer Portal', partner: 'Setup Partner Portal', admin: 'SCR Control Hub' };
const navs = {
  customer: [{ icon:'dashboard', label:'Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'My Robots', id:'robots', href:'/#robots' }, { icon:'clipboard', label:'History & Maintenance', id:'history', href:'/#history' }, { icon:'user', label:'Profile', id:'profile', href:'/#profile' }],
  partner: [{ icon:'dashboard', label:'Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'Assigned Robots', id:'robots', href:'/#robots' }, { icon:'wrench', label:'Setup & Maintenance', id:'work', href:'/#work' }, { icon:'user', label:'Profile', id:'profile', href:'/#profile' }],
  admin: [{ icon:'dashboard', label:'Fleet Dashboard', id:'dashboard', href:'/' }, { icon:'robot', label:'Robots', id:'robots', href:'/#robots' }, { icon:'users', label:'People & Assignments', id:'people', href:'/#people' }, { icon:'signal', label:'Connectivity Lab', id:'lab', href:'/#lab' }]
};

function roleData(role) {
  const user = getDemoUser(role);
  if (role === USER_ROLES.CUSTOMER) return { user, robots: getDemoRobotsForCustomer(user.uid), tasks: DEMO_TASKS };
  if (role === USER_ROLES.PARTNER) return { user, robots: getDemoRobotsForPartner(user.uid), tasks: [...DEMO_TASKS, ...DEMO_SETUP_JOBS] };
  return { user, robots: DEMO_ROBOTS, tasks: [...DEMO_TASKS, ...DEMO_SETUP_JOBS] };
}

async function getLiveAdminData() {
  const database = await getDatabase();
  const currentUser = await getCurrentFirebaseUser();
  if (!database || !currentUser) throw new Error('The Firebase session is not available. Sign in again.');

  const { get, ref } = await import('firebase/database');
  const [robotsSnapshot, latestSnapshot] = await Promise.all([
    get(ref(database, 'robots')),
    get(ref(database, 'robotLatest')),
  ]);
  const latestRobots = latestSnapshot.val() || {};
  const robots = Object.values(robotsSnapshot.val() || {}).map((robot) => ({
    ...robot,
    id: robot.robotId,
    latestTelemetry: latestRobots[robot.robotId] || null,
  }));
  return {
    user: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email || 'Admin',
      role: USER_ROLES.ADMIN,
    },
    robots,
    tasks: [],
  };
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
  const robotIds = Object.entries(access).filter(([, allowed]) => allowed === true).map(([robotId]) => robotId);
  const robotSnapshots = await Promise.all(robotIds.map((robotId) => get(ref(database, `robots/${robotId}`))));
  const robots = robotSnapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => ({ ...snapshot.val(), id: snapshot.key, latestTelemetry: null }));

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

function robotRow(robot) {
  const telemetry = robot.latestTelemetry;
  return `<tr><td><strong>${robot.robotId}</strong><br><span class="muted">${robot.name}</span></td><td>${robot.installationSite}</td><td>${createStatusBadge({ status: robot.status })?.outerHTML || robot.status}</td><td>${formatTelemetryValue(telemetry?.batteryPercent, '%')}</td><td>${telemetry?.timestamp ? formatRelativeTime(telemetry.timestamp) : 'No data'}</td></tr>`;
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
  const { user, robots, tasks } = data;
  const counts = { total:robots.length, online:robots.filter((r) => ['online','cleaning'].includes(r.status)).length, offline:robots.filter((r) => r.status === 'offline').length, unknown:robots.filter((r) => r.status === 'unknown').length };
  const sidebar = createSidebarNav({ portalName:labels[role], navItems:navs[role], currentPage:'dashboard', user, onSignOut: async () => { if (mode === 'firebase') await signOutFirebase(); else await signOutDemo(); sessionStorage.removeItem(`sasya-${role}-signed-in`); login(app, role, mode); } });
  const shell = document.createElement('div'); shell.className = 'portal-shell';
  const main = document.createElement('div'); main.className = 'portal-main';
  if (mode !== 'firebase') main.append(createDemoBanner());
  const content = document.createElement('main'); content.className = 'portal-content';
  content.innerHTML = `<div class="portal-topbar"><div><span class="eyebrow">${labels[role]}</span><h1>${role === 'admin' ? 'Fleet overview' : `Welcome, ${user.name.split(' ')[0]}`}</h1></div><span class="status-badge ${mode === 'firebase' ? 'status-success' : 'status-warning'}">${mode === 'firebase' ? 'Live Firebase data' : 'Demo data'}</span></div>
    ${liveDataError ? `<div class="notice warning">${liveDataError}</div>` : ''}
    <div class="stats-grid" id="stats"></div>
    <section class="card"><div class="portal-topbar"><div><h2>Robots in scope</h2><p class="muted">Only records permitted for this demo role are shown.</p></div><input id="robot-filter" placeholder="Search robots" aria-label="Search robots"></div><div class="table-wrap"><table><thead><tr><th>Robot</th><th>Site</th><th>Status</th><th>Battery</th><th>Last update</th></tr></thead><tbody id="robot-table"></tbody></table></div></section>
    <div class="grid grid-2" style="margin-top:20px"><section class="card"><h2>${role === 'customer' ? 'Maintenance & alerts' : role === 'partner' ? 'Assigned work' : 'Recent alerts'}</h2><div id="task-list"></div></section><section class="card"><h2>Connectivity status</h2><div class="notice warning"><strong>${mode === 'firebase' ? 'Production Firebase connected.' : 'Demo mode.'}</strong> No live device connection is claimed. Firebase mode and ESP32 payload validation are available only after configuration.</div><p class="muted" style="margin-top:14px">Remote start, stop, movement, and cleaning commands are unavailable until the R&D team confirms a safe command protocol.</p></section></div>
    ${role === 'admin' && mode === 'firebase' ? '<section class="card" style="margin-top:20px"><h2>Create robot</h2><p class="muted">Create a robot record in Firebase. Existing robot IDs cannot be overwritten.</p><form id="robot-create-form"><div class="grid grid-2"><div class="field"><label for="robot-id">Robot ID</label><input id="robot-id" value="SCR-001" pattern="[A-Za-z0-9_\\-]+" required></div><div class="field"><label for="robot-name">Robot name</label><input id="robot-name" value="Sasya Cleaning Robot 001" required></div><div class="field"><label for="installation-site">Installation site</label><input id="installation-site" value="Not assigned" required></div><div class="field"><label for="robot-model">Model</label><input id="robot-model" value="SCR" required></div><div class="field"><label for="firmware-version">Firmware version</label><input id="firmware-version" value="not-installed" required></div><div class="field"><label for="telemetry-interval">Telemetry interval (seconds)</label><input id="telemetry-interval" type="number" min="5" value="60" required></div><div class="field"><label for="battery-capacity">Battery capacity (%)</label><input id="battery-capacity" type="number" min="1" max="100" value="100" required></div><div class="field"><label for="water-capacity">Water tank capacity (litres)</label><input id="water-capacity" type="number" min="0" value="0" required></div></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Create robot</button><div id="robot-create-status" class="notice" hidden style="margin-top:14px"></div></form></section><section class="card" style="margin-top:20px"><h2>Upload an image</h2><p class="muted">Images are stored in Cloudinary; the upload record is stored in Firebase.</p><form id="image-upload-form"><div class="field"><label for="image-file">Image file</label><input id="image-file" type="file" accept="image/jpeg,image/png,image/webp" required></div><button class="btn btn-primary" type="submit" style="margin-top:14px">Upload image</button><div id="image-upload-status" class="notice" hidden style="margin-top:14px"></div></form></section>' : ''}`;
  const stats = content.querySelector('#stats');
  [['robot', 'Robots', counts.total], ['signal', 'Online / active', counts.online], ['alert', 'Offline', counts.offline], ['dashboard', 'Unknown', counts.unknown]].forEach(([icon,label,value]) => stats.append(createStatCard({ icon: `<span>${icon}</span>`, label, value, subtitle: mode === 'firebase' ? 'Calculated from Firebase records' : 'Calculated from demo records' })));
  const table = content.querySelector('#robot-table');
  const drawRows = (query = '') => { table.innerHTML = robots.filter((robot) => `${robot.robotId} ${robot.name} ${robot.installationSite}`.toLowerCase().includes(query.toLowerCase())).map(robotRow).join('') || '<tr><td colspan="5" class="empty-state">No robots match this search.</td></tr>'; };
  drawRows(); content.querySelector('#robot-filter').addEventListener('input', (event) => drawRows(event.target.value));
  content.querySelector('#task-list').innerHTML = tasks.slice(0, 5).map((task) => `<div style="padding:12px 0;border-bottom:1px solid var(--border)"><strong>${task.title || task.name}</strong><br><span class="muted">${task.description || task.site || 'Operational record'}</span> ${createStatusBadge({ status:task.status })?.outerHTML || ''}</div>`).join('') || '<div class="empty-state">No current assignments.</div>';
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
        const { get, ref, set } = await import('firebase/database');
        const robotRef = ref(database, `robots/${robotId}`);
        const existing = await get(robotRef);
        if (existing.exists()) throw new Error(`Robot ${robotId} already exists. Use a different ID.`);
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
        await set(robotRef, robot);
        status.className = 'notice success';
        status.textContent = `Robot ${robotId} created successfully in Firebase.`;
        robotForm.reset();
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
