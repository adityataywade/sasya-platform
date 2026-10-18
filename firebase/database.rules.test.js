import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rules = JSON.parse(await readFile(new URL('./database.rules.json', import.meta.url), 'utf8'));
assert.equal(rules.rules['.read'], false, 'Root reads must be denied by default');
assert.equal(rules.rules['.write'], false, 'Root writes must be denied by default');
for (const path of ['userProfiles', 'userRoles', 'robots', 'robotLatest', 'robotEvents', 'customerRobotAccess', 'partnerRobotAccess', 'maintenanceTasks', 'auditLogs']) {
  assert.ok(rules.rules[path], `Expected protected path: ${path}`);
}
console.log('Firebase rules sanity checks passed. Run Emulator Suite tests before deployment.');
