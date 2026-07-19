const { configured, json, readBody, safeEqual, sameOrigin, setSession } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Origem da solicitação não permitida.' });
  if (!configured()) {
    return json(res, 503, {
      error: 'O painel ainda precisa das credenciais na Vercel.',
      setupRequired: true
    });
  }

  try {
    const body = await readBody(req);
    const validEmail = safeEqual(String(body.email || '').trim().toLowerCase(), String(process.env.ADMIN_EMAIL).trim().toLowerCase());
    const validPassword = safeEqual(String(body.password || ''), String(process.env.ADMIN_PASSWORD));
    if (!validEmail || !validPassword) return json(res, 401, { error: 'E-mail ou senha incorretos.' });

    setSession(res, String(process.env.ADMIN_EMAIL).trim().toLowerCase());
    return json(res, 200, { ok: true, email: String(process.env.ADMIN_EMAIL).trim().toLowerCase() });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Não foi possível entrar.' });
  }
};
