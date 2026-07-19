const { commitFiles, getFile, getManifest } = require('../_lib/github');
const { renderBlogIndex, renderSitemap } = require('../_lib/render');
const { json, readBody, requireAdmin, sameOrigin } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Origem da solicitação não permitida.' });
  if (!requireAdmin(req, res)) return;

  try {
    const body = await readBody(req);
    const slug = String(body.slug || '').trim();
    if (!/^[a-z0-9-]+$/.test(slug)) return json(res, 400, { error: 'Matéria inválida.' });

    const manifest = await getManifest();
    const published = (manifest.posts || []).find((post) => post.id === body.id || post.slug === slug);
    let posts = (manifest.posts || []).filter((post) => post.id !== body.id && post.slug !== slug);
    if (published?.featured && posts.length && !posts.some((post) => post.featured)) posts[0].featured = true;

    const changes = [];
    const draft = await getFile(`content/drafts/${slug}.json`);
    if (draft) changes.push({ path: draft.path, content: null });
    if (published) {
      const article = await getFile(`blog/${published.slug}.html`);
      if (article) changes.push({ path: article.path, content: null });
      changes.push(
        { path: 'blog/index.html', content: renderBlogIndex(posts) },
        { path: 'sitemap.xml', content: renderSitemap(posts) },
        { path: 'content/posts.json', content: `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), posts }, null, 2)}\n` }
      );
    }

    if (!changes.length) return json(res, 404, { error: 'A matéria não foi encontrada.' });
    await commitFiles(changes, `Remove matéria: ${published?.title || slug}`);
    return json(res, 200, { ok: true, message: 'Matéria removida.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Não foi possível remover a matéria.' });
  }
};
