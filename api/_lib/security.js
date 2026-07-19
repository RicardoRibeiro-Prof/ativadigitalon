const crypto = require('crypto');

const COOKIE_NAME = 'ativa_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((value) => value.trim().split('='))
    .reduce((cookies, parts) => {
      if (parts[0]) cookies[parts.shift()] = decodeURIComponent(parts.join('='));
      return cookies;
    }, {});
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signature(value) {
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function configured() {
  return Boolean(
    process.env.ADMIN_EMAIL &&
    String(process.env.ADMIN_PASSWORD || '').length >= 10 &&
    String(process.env.SESSION_SECRET || '').length >= 32 &&
    process.env.GITHUB_TOKEN
  );
}

function draftKey() {
  return crypto.createHash('sha256').update(String(process.env.SESSION_SECRET || '')).digest();
}

function encryptDraft(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', draftKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptDraft(value) {
  const payload = Buffer.from(String(value), 'base64url');
  if (payload.length < 29) throw new Error('Rascunho inválido.');
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', draftKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function createSession(email) {
  const payload = base64url(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  }));
  return `${payload}.${signature(payload)}`;
}

function verifySession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token || !process.env.SESSION_SECRET) return null;
  const [payload, tokenSignature] = token.split('.');
  if (!payload || !tokenSignature || !safeEqual(signature(payload), tokenSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.email || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch (_) {
    return null;
  }
}

function setSession(res, email) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(createSession(email))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`
  );
}

function clearSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const expectedHost = req.headers['x-forwarded-host'] || req.headers.host;
    return new URL(origin).host === expectedHost;
  } catch (_) {
    return false;
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 9_000_000) throw new Error('O envio ultrapassou o limite permitido.');
  }
  return JSON.parse(raw || '{}');
}

function requireAdmin(req, res) {
  const session = verifySession(req);
  if (!session) {
    json(res, 401, { error: 'Sua sessão expirou. Entre novamente.' });
    return null;
  }
  return session;
}

module.exports = {
  clearSession,
  configured,
  decryptDraft,
  encryptDraft,
  json,
  readBody,
  requireAdmin,
  safeEqual,
  sameOrigin,
  setSession,
  verifySession
};
