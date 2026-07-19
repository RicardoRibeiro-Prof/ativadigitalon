const { clearSession, json, sameOrigin } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Origem da solicitação não permitida.' });
  clearSession(res);
  return json(res, 200, { ok: true });
};
