import { DEMO_USERS, USER_ROLES } from '@sasya/domain-models';

export function getDemoUser(role = USER_ROLES.CUSTOMER) {
  return DEMO_USERS.find((user) => user.role === role) || DEMO_USERS[0];
}

export async function signInDemo({ email = '', role = USER_ROLES.CUSTOMER } = {}) {
  const user = DEMO_USERS.find((candidate) => candidate.role === role && (!email || candidate.email === email));
  if (!user) throw new Error('No demo user exists for this role.');
  return user;
}

export function signOutDemo() {
  return Promise.resolve();
}
