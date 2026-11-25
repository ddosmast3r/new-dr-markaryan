import { createHash, randomBytes } from 'node:crypto';

const invitationKey = (token) => `invite:${createHash('sha256').update(token).digest('hex')}`;

export function hasAccess(store, config, userId) {
  const access = store.state(`access:${userId}`);
  return access !== 'revoked' && (access === 'allowed' || config.allowedUsers.has(String(userId)));
}

export function mintInvite(store, { uses = 3, days = 7 } = {}) {
  if (!Number.isInteger(uses) || uses < 1 || uses > 50 || !Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error('INVALID_INVITATION_LIMITS');
  }
  const token = randomBytes(24).toString('base64url');
  store.state(invitationKey(token), JSON.stringify({ uses, expiresAt: Date.now() + days * 86_400_000, users: [] }));
  return token;
}

export function redeemInvite(store, token, userId) {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token) || !/^[1-9]\d*$/.test(String(userId))) return false;
  const raw = store.state(invitationKey(token));
  if (!raw) return false;
  const invitation = JSON.parse(raw);
  if (invitation.expiresAt < Date.now()) return false;
  userId = String(userId);
  if (invitation.users.includes(userId)) return store.state(`access:${userId}`) === 'allowed';
  if (invitation.users.length >= invitation.uses) return false;
  invitation.users.push(userId);
  store.state(invitationKey(token), JSON.stringify(invitation));
  store.state(`access:${userId}`, 'allowed');
  return true;
}
