const { commitFiles, getFile, getManifest } = require('../_lib/github');
const { normalizePost, renderArticle, renderBlogIndex, renderSitemap, validatePost } = require('../_lib/render');
const { encryptDraft, json, readBody, requireAdmin, sameOrigin } = require('../_lib/security');

function decodeImage(dataUrl) {
  if (!dataUrl) return null;
  const match = String(dataUrl).match(/^data:image\/(webp|jpeg|png);base64,([a-z0-9+/=]+)$/i);
  if (!match) throw new Error('O formato da imagem não é aceito. Use JPG, PNG ou WebP.');
  const content = Buffer.from(match[2], 'base64');
  if (content.length > 5_000_000) throw new Error('A imagem deve ter no máximo 5 MB.');
  return { content, extension: match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase() };
}

function manifestPost(post) {
  const copy = { ...post };
  delete copy.contentHtml;
  delete copy.imageData;
  delete copy.hasPublishedVersion;
  return copy;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Origem da solicitação não permitida.' });
  if (!requireAdmin(req, res)) return;

  try {
    const body = await readBody(req);
    const action = body.action === 'publish' ? 'publish' : 'draft';
    const manifest = await getManifest();
    const existing = (manifest.posts || []).find((item) => item.id === body.post?.id || item.slug === body.post?.slug) || {};
    const post = normalizePost({ ...body.post, status: action === 'publish' ? 'published' : 'draft' }, existing);
    const image = decodeImage(body.post?.imageData);
    if (image) post.imagePath = `assets/blog/${post.slug}.${image.extension}`;
    if (body.post?.imageData) post.imageData = body.post.imageData;

    const errors = validatePost(post, true);
    if (errors.length) return json(res, 400, { error: errors[0], errors });

    if (action === 'draft') {
      const draftPath = `content/drafts/${post.slug}.json`;
      const encrypted = encryptDraft(JSON.stringify(post));
      const changes = [{ path: draftPath, content: `${JSON.stringify({ version: 1, payload: encrypted }, null, 2)}\n` }];
      if (body.post?.previousSlug && body.post.previousSlug !== post.slug) {
        const previousDraft = await getFile(`content/drafts/${body.post.previousSlug}.json`);
        if (previousDraft) changes.push({ path: previousDraft.path, content: null });
      }
      await commitFiles(changes, `Salva rascunho: ${post.title}`);
      return json(res, 200, { ok: true, post, message: 'Rascunho salvo com segurança.' });
    }

    delete post.imageData;
    let posts = (manifest.posts || []).filter((item) => item.id !== post.id && item.slug !== post.slug);
    if (post.featured) posts = posts.map((item) => ({ ...item, featured: false }));
    if (!post.featured && !posts.some((item) => item.featured)) post.featured = true;
    posts.unshift(manifestPost(post));

    const changes = [];
    if (image) changes.push({ path: post.imagePath, content: image.content });
    changes.push(
      { path: `blog/${post.slug}.html`, content: renderArticle(post, posts) },
      { path: 'blog/index.html', content: renderBlogIndex(posts) },
      { path: 'sitemap.xml', content: renderSitemap(posts) },
      { path: 'content/posts.json', content: `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), posts }, null, 2)}\n` }
    );

    const draftPath = `content/drafts/${post.slug}.json`;
    const draft = await getFile(draftPath);
    if (draft) changes.push({ path: draftPath, content: null });
    if (body.post?.previousSlug && body.post.previousSlug !== post.slug) {
      const oldArticle = await getFile(`blog/${body.post.previousSlug}.html`);
      if (oldArticle) changes.push({ path: oldArticle.path, content: null });
    }

    const commit = await commitFiles(changes, `Publica matéria: ${post.title}`);
    return json(res, 200, {
      ok: true,
      post: manifestPost(post),
      commit: commit.sha,
      url: `/blog/${post.slug}.html`,
      message: 'Matéria publicada. A Vercel iniciará a atualização do site.'
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Não foi possível salvar a matéria.' });
  }
};
