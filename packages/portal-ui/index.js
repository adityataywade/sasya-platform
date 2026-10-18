import { createSidebarNav, createDemoBanner, createStatCard, createStatusBadge } from '@sasya/shared-ui';
import { DEMO_USERS, DEMO_ROBOTS, DEMO_TASKS, DEMO_SETUP_JOBS, USER_ROLES, getDemoRobotsForCustomer, getDemoRobotsForPartner, formatRelativeTime, formatTelemetryValue } from '@sasya/domain-models';
import { getDemoUser, signInDemo, signOutDemo } from '@sasya/auth-service';
import { createTelemetryService } from '@sasya/telemetry-service';
import { getDataMode, getFirebaseApp } from '@sasya/firebase-client';

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

function robotRow(robot) {
  const telemetry = robot.latestTelemetry;
  return `<tr><td><strong>${robot.robotId}</strong><br><span class="muted">${robot.name}</span></td><td>${robot.installationSite}</td><td>${createStatusBadge({ status: robot.status })?.outerHTML || robot.status}</td><td>${formatTelemetryValue(telemetry?.batteryPercent, '%')}</td><td>${telemetry?.timestamp ? formatRelativeTime(telemetry.timestamp) : 'No data'}</td></tr>`;
}

function login(app, role) {
  app.innerHTML = `<main class="section"><div class="container" style="max-width:500px"><div class="card"><span class="eyebrow">${labels[role]}</span><h1>Sign in</h1><p class="muted">Demo mode is active. Choose the role below; production access will be enforced by Firebase Authentication and database rules.</p><form id="login-form"><div class="field"><label for="email">Email</label><input id="email" type="email" value="${getDemoUser(role).email}" required></div><div class="field" style="margin-top:14px"><label for="password">Password</label><input id="password" type="password" value="demo-password" required></div><button class="btn btn-primary" style="margin-top:18px">Continue in demo mode</button><div id="login-error" class="notice warning" hidden></div></form></div></div></main>`;
  app.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await signInDemo({ email: app.querySelector('#email').value, role }); sessionStorage.setItem(`sasya-${role}-signed-in`, 'true'); renderPortal(app, role); }
    catch (error) { const output = app.querySelector('#login-error'); output.hidden = false; output.textContent = error.message; }
  });
}

function renderPortal(app, role) {
  const { user, robots, tasks } = roleData(role);
  const counts = { total:robots.length, online:robots.filter((r) => ['online','cleaning'].includes(r.status)).length, offline:robots.filter((r) => r.status === 'offline').length, unknown:robots.filter((r) => r.status === 'unknown').length };
  const sidebar = createSidebarNav({ portalName:labels[role], navItems:navs[role], currentPage:'dashboard', user, onSignOut: async () => { await signOutDemo(); sessionStorage.removeItem(`sasya-${role}-signed-in`); renderPortal(app, role); } });
  const shell = document.createElement('div'); shell.className = 'portal-shell';
  const main = document.createElement('div'); main.className = 'portal-main';
  main.append(createDemoBanner());
  const content = document.createElement('main'); content.className = 'portal-content';
  content.innerHTML = `<div class="portal-topbar"><div><span class="eyebrow">${labels[role]}</span><h1>${role === 'admin' ? 'Fleet overview' : `Welcome, ${user.name.split(' ')[0]}`}</h1></div><span class="status-badge status-warning">Demo data</span></div>
    <div class="stats-grid" id="stats"></div>
    <section class="card"><div class="portal-topbar"><div><h2>Robots in scope</h2><p class="muted">Only records permitted for this demo role are shown.</p></div><input id="robot-filter" placeholder="Search robots" aria-label="Search robots"></div><div class="table-wrap"><table><thead><tr><th>Robot</th><th>Site</th><th>Status</th><th>Battery</th><th>Last update</th></tr></thead><tbody id="robot-table"></tbody></table></div></section>
    <div class="grid grid-2" style="margin-top:20px"><section class="card"><h2>${role === 'customer' ? 'Maintenance & alerts' : role === 'partner' ? 'Assigned work' : 'Recent alerts'}</h2><div id="task-list"></div></section><section class="card"><h2>Connectivity status</h2><div class="notice warning"><strong>Demo mode.</strong> No live device connection is claimed. Firebase mode and ESP32 payload validation are available only after configuration.</div><p class="muted" style="margin-top:14px">Remote start, stop, movement, and cleaning commands are unavailable until the R&D team confirms a safe command protocol.</p></section></div>`;
  const stats = content.querySelector('#stats');
  [['robot', 'Robots', counts.total], ['signal', 'Online / active', counts.online], ['alert', 'Offline', counts.offline], ['dashboard', 'Unknown', counts.unknown]].forEach(([icon,label,value]) => stats.append(createStatCard({ icon: `<span>${icon}</span>`, label, value, subtitle:'Calculated from demo records' })));
  const table = content.querySelector('#robot-table');
  const drawRows = (query = '') => { table.innerHTML = robots.filter((robot) => `${robot.robotId} ${robot.name} ${robot.installationSite}`.toLowerCase().includes(query.toLowerCase())).map(robotRow).join('') || '<tr><td colspan="5" class="empty-state">No robots match this search.</td></tr>'; };
  drawRows(); content.querySelector('#robot-filter').addEventListener('input', (event) => drawRows(event.target.value));
  content.querySelector('#task-list').innerHTML = tasks.slice(0, 5).map((task) => `<div style="padding:12px 0;border-bottom:1px solid var(--border)"><strong>${task.title || task.name}</strong><br><span class="muted">${task.description || task.site || 'Operational record'}</span> ${createStatusBadge({ status:task.status })?.outerHTML || ''}</div>`).join('') || '<div class="empty-state">No current assignments.</div>';
  main.append(content); shell.append(sidebar, main); app.replaceChildren(shell);
}

export async function startPortal(app, role) {
  if (sessionStorage.getItem(`sasya-${role}-signed-in`) === 'true') renderPortal(app, role); else login(app, role);
  if (getDataMode() === 'firebase') await getFirebaseApp();
  const service = createTelemetryService({ mode:getDataMode() }); service.dispose();
}
