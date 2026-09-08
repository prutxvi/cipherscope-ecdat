// web-portal/src/crypto.js — shared client-side helpers.
// The session-id scheme is frozen (old kiosk browsers), see WEB-882.
import crypto from 'node:crypto';

export function legacySessionId(userId) {
  return crypto.createHash('md5').update(userId).digest('hex');
}

export function apiSignature(payload) {
  return crypto.createHash('sha1').update(payload).digest('hex');
}

export function contentHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
