const { getDirectory, getFile, getManifest } = require('../_lib/github');
const { extractContent } = require('../_lib/render');
const { decryptDraft, json, requireAdmin } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  if (!requireAdmin(req, res)) return;

  try {
    const manifest = await getManifest();
    const hydrated = [];
    for (const post of manifest.posts || []) {
      const article = await getFile(`blog/${post.slug}.html`);
      hydrated.push({ ...post, contentHtml: extractContent(article?.content || '') });
    }

    const drafts = [];
    const draftEntries = await getDirectory('content/drafts');
    for (const entry of draftEntries.filter((item) => item.type === 'file' && item.name.endsWith('.json'))) {
      const draftFile = await getFile(entry.path);
      if (draftFile) {
        try {
          const envelope = JSON.parse(draftFile.content);
          drafts.push(JSON.parse(decryptDraft(envelope.payload)));
        } catch (_) {
          // Um rascunho corrompido ou criado com outro segredo não bloqueia o restante do painel.
        }
      }
    }

    const posts = [...hydrated];
    for (const draft of drafts) {
      const publishedIndex = posts.findIndex((post) => post.id === draft.id || post.slug === draft.slug);
      if (publishedIndex >= 0) {
        posts[publishedIndex] = { ...posts[publishedIndex], ...draft, status: 'draft', hasPublishedVersion: true };
      } else {
        posts.push({ ...draft, status: 'draft', hasPublishedVersion: false });
      }
    }

    posts.sort((a, b) => String(b.updatedAt || b.publishedAt).localeCompare(String(a.updatedAt || a.publishedAt)));
    return json(res, 200, { posts });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Não foi possível carregar as matérias.' });
  }
};
