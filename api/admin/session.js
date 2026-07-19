const { configured, json, verifySession } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  const session = verifySession(req);
  return json(res, 200, {
    authenticated: Boolean(session),
    configured: configured(),
    email: session?.email || null
  });
};
