const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  posts: [],
  current: null,
  imageData: '',
  autoSlug: true,
  busy: false
};

const elements = {
  loginView: $('#loginView'), appView: $('#appView'), loginForm: $('#loginForm'), loginError: $('#loginError'),
  setupView: $('#setupView'), loginFormWrap: $('#loginFormWrap'), postsView: $('#postsView'), editorView: $('#editorView'),
  postsList: $('#postsList'), emptyState: $('#emptyState'), postForm: $('#postForm'), editor: $('#contentEditor'),
  toast: $('#toast'), previewModal: $('#previewModal'), previewFrame: $('#previewFrame')
};

function slugify(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

function escapeHtml(value = '') {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function formatDate(value) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.endsWith('/login')) showLogin();
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível concluir a operação.');
    error.data = data;
    throw error;
  }
  return data;
}

function toast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast show${type === 'error' ? ' error' : ''}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { elements.toast.className = 'toast'; }, 4800);
}

function showLogin(setup = false) {
  elements.appView.hidden = true;
  elements.loginView.hidden = false;
  elements.setupView.hidden = !setup;
  elements.loginFormWrap.hidden = setup;
}

function showApp(email) {
  elements.loginView.hidden = true;
  elements.appView.hidden = false;
  $('#adminEmail').textContent = email || 'Administrador';
  showPosts();
}

async function checkSession() {
  try {
    const session = await api('/api/admin/session', { method: 'GET', headers: {} });
    if (!session.configured) return showLogin(true);
    if (!session.authenticated) return showLogin(false);
    showApp(session.email);
    await loadPosts();
  } catch (error) {
    showLogin(false);
    $('#loginError').textContent = error.message;
  }
}

async function login(event) {
  event.preventDefault();
  const button = $('button[type="submit"]', elements.loginForm);
  button.disabled = true;
  $('#loginError').textContent = '';
  try {
    const result = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value })
    });
    elements.loginForm.reset();
    showApp(result.email);
    await loadPosts();
  } catch (error) {
    if (error.data?.setupRequired) showLogin(true);
    else $('#loginError').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function loadPosts() {
  elements.postsList.innerHTML = '<div class="empty-state"><strong>Carregando matérias…</strong></div>';
  try {
    const data = await api('/api/admin/posts', { method: 'GET', headers: {} });
    state.posts = data.posts || [];
    renderPosts();
  } catch (error) {
    elements.postsList.innerHTML = '';
    elements.emptyState.hidden = false;
    elements.emptyState.innerHTML = `<strong>Não foi possível carregar.</strong><p>${escapeHtml(error.message)}</p>`;
  }
}

function renderPosts() {
  const search = $('#postSearch').value.trim().toLowerCase();
  const posts = state.posts.filter((post) => `${post.title} ${post.category}`.toLowerCase().includes(search));
  const published = state.posts.filter((post) => post.status === 'published' || post.hasPublishedVersion).length;
  const drafts = state.posts.filter((post) => post.status === 'draft').length;
  $('#publishedCount').textContent = published;
  $('#draftCount').textContent = drafts;
  $('#totalCount').textContent = state.posts.length;
  elements.emptyState.hidden = posts.length > 0;
  elements.postsList.innerHTML = posts.map((post) => {
    const live = post.status === 'published' || post.hasPublishedVersion;
    const statusLabel = post.status === 'draft' ? (post.hasPublishedVersion ? 'Rascunho + publicada' : 'Rascunho') : 'Publicada';
    const image = post.imageData || (post.imagePath ? `../${post.imagePath}` : '../assets/og-ativa-digital-on.jpg');
    return `<article class="post-row" data-id="${escapeHtml(post.id)}">
      <img class="post-thumb" src="${escapeHtml(image)}" alt="">
      <div class="post-info"><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category)}</small></div>
      <span class="status ${post.status === 'draft' ? 'draft' : 'published'}">${statusLabel}</span>
      <span class="post-date">${formatDate(post.updatedAt || post.publishedAt)}</span>
      <div class="row-actions"><button class="icon-button" type="button" data-edit="${escapeHtml(post.id)}" title="Editar">✎</button>${live ? `<a class="icon-button open-action" href="../blog/${escapeHtml(post.slug)}.html" target="_blank" title="Abrir matéria">↗</a>` : ''}<button class="icon-button danger" type="button" data-delete="${escapeHtml(post.id)}" title="Excluir">×</button></div>
    </article>`;
  }).join('');
}

function showPosts() {
  elements.editorView.hidden = true;
  elements.postsView.hidden = false;
  $('#pageTitle').textContent = 'Matérias do blog';
  $('#newPostTop').hidden = false;
  $('.app').classList.remove('menu-open');
}

function emptyArticle() {
  return {
    id: '', slug: '', title: '', category: '', excerpt: '', lead: '', readTime: 5, imagePath: '', imageAlt: '',
    seoTitle: '', seoDescription: '', featured: false, contentHtml: '<p></p>', status: 'draft'
  };
}

function openEditor(post = null) {
  state.current = post ? { ...post } : emptyArticle();
  state.imageData = post?.imageData || '';
  state.autoSlug = !post;
  elements.postForm.reset();
  $('#postTitle').value = state.current.title || '';
  $('#postSlug').value = state.current.slug || '';
  $('#postCategory').value = state.current.category || '';
  $('#postReadTime').value = state.current.readTime || 5;
  $('#postExcerpt').value = state.current.excerpt || '';
  $('#postLead').value = state.current.lead || '';
  $('#imageAlt').value = state.current.imageAlt || '';
  $('#seoTitle').value = state.current.seoTitle || '';
  $('#seoDescription').value = state.current.seoDescription || '';
  $('#postFeatured').checked = Boolean(state.current.featured);
  elements.editor.innerHTML = state.current.contentHtml || '<p></p>';
  updateImagePreview();
  updateCounters();
  elements.postsView.hidden = true;
  elements.editorView.hidden = false;
  $('#pageTitle').textContent = post ? 'Editar matéria' : 'Nova matéria';
  $('#newPostTop').hidden = true;
  $('.app').classList.remove('menu-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => $('#postTitle').focus(), 80);
}

function updateImagePreview() {
  const preview = $('#coverPreview');
  const source = state.imageData || (state.current?.imagePath ? `../${state.current.imagePath}` : '');
  preview.hidden = !source;
  $('.upload-empty').hidden = Boolean(source);
  $('#changeImage').hidden = !source;
  if (source) preview.src = source;
}

function updateCounters() {
  $('#excerptCount').textContent = $('#postExcerpt').value.length;
  $('#seoTitleCount').textContent = $('#seoTitle').value.length;
  $('#seoDescriptionCount').textContent = $('#seoDescription').value.length;
}

function collectPost() {
  const contentHtml = elements.editor.innerHTML.trim();
  const contentText = elements.editor.innerText.replace(/\s+/g, ' ').trim();
  if (contentText.length < 80) throw new Error('Escreva um pouco mais no conteúdo da matéria.');
  return {
    id: state.current?.id || '',
    previousSlug: state.current?.slug || '',
    slug: $('#postSlug').value,
    title: $('#postTitle').value.trim(),
    category: $('#postCategory').value.trim(),
    excerpt: $('#postExcerpt').value.trim(),
    lead: $('#postLead').value.trim(),
    readTime: Number($('#postReadTime').value),
    imagePath: state.current?.imagePath || '',
    imageData: state.imageData || '',
    imageAlt: $('#imageAlt').value.trim(),
    seoTitle: $('#seoTitle').value.trim(),
    seoDescription: $('#seoDescription').value.trim(),
    featured: $('#postFeatured').checked,
    contentHtml
  };
}

function validateForm() {
  if (!elements.postForm.reportValidity()) throw new Error('Revise os campos destacados antes de continuar.');
  if (!state.imageData && !state.current?.imagePath) throw new Error('Escolha uma imagem de capa.');
}

function setBusy(busy, label = '') {
  state.busy = busy;
  ['#saveDraftButton', '#publishButton', '#previewButton'].forEach((selector) => { $(selector).disabled = busy; });
  $('#publishButton').textContent = busy && label === 'publish' ? 'Publicando…' : 'Publicar matéria';
  $('#saveDraftButton').textContent = busy && label === 'draft' ? 'Salvando…' : 'Salvar rascunho';
}

async function save(action) {
  if (state.busy) return;
  try {
    validateForm();
    const post = collectPost();
    setBusy(true, action);
    const result = await api('/api/admin/save', { method: 'POST', body: JSON.stringify({ action, post }) });
    toast(result.message);
    await loadPosts();
    showPosts();
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    setBusy(false);
  }
}

async function removePost(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  const liveWarning = post.status === 'published' || post.hasPublishedVersion ? ' Esta matéria também será retirada do blog.' : '';
  if (!confirm(`Excluir “${post.title}”?${liveWarning}`)) return;
  try {
    const result = await api('/api/admin/delete', { method: 'POST', body: JSON.stringify({ id: post.id, slug: post.slug }) });
    toast(result.message);
    await loadPosts();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if (file.size > 12_000_000) throw new Error('A imagem original deve ter no máximo 12 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
      element.src = url;
    });
    const maximum = 1600;
    const scale = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', .86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function selectImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state.imageData = await compressImage(file);
    if (!$('#imageAlt').value.trim()) $('#imageAlt').value = $('#postTitle').value.trim();
    updateImagePreview();
  } catch (error) {
    toast(error.message, 'error');
    event.target.value = '';
  }
}

function preview() {
  try {
    validateForm();
    const post = collectPost();
    const cover = state.imageData || `/${post.imagePath}`;
    elements.previewFrame.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050505;color:#d2d2d2;font:17px/1.7 Inter,Arial,sans-serif}.hero{padding:60px max(24px,calc((100% - 920px)/2));background:radial-gradient(circle at 90% 10%,rgba(255,115,0,.2),transparent 35%)}.meta{color:#ff7300;font-size:12px;font-weight:800}.hero h1{max-width:850px;margin:18px 0;font-size:clamp(40px,7vw,68px);line-height:1.05;letter-spacing:-.05em;color:white}.lead{max-width:780px;font-size:19px}.cover{width:min(920px,calc(100% - 40px));aspect-ratio:16/9;margin:35px auto 0;object-fit:cover;border-radius:20px}.content{width:min(760px,calc(100% - 40px));margin:55px auto 90px}.content h2{margin-top:45px;color:white;font-size:32px;line-height:1.2}.content h3{margin-top:30px;color:white;font-size:23px}.content .highlight,.content blockquote{margin:30px 0;padding:22px;border-left:4px solid #ff7300;background:#111}.content a{color:#ffbd00}@media(max-width:600px){.hero{padding-top:40px}.cover{border-radius:13px}.content{margin-top:38px}}</style></head><body><section class="hero"><div class="meta">${escapeHtml(post.category)} · ${post.readTime} min de leitura</div><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.lead)}</p></section><img class="cover" src="${cover}" alt="${escapeHtml(post.imageAlt)}"><article class="content">${post.contentHtml}</article></body></html>`;
    elements.previewModal.showModal();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function applyFormat(button) {
  elements.editor.focus();
  if (button.dataset.link !== undefined) {
    const url = prompt('Cole o endereço do link:');
    if (url) document.execCommand('createLink', false, url);
    return;
  }
  if (button.dataset.highlight !== undefined) {
    const selection = window.getSelection();
    const text = selection?.toString() || 'Escreva aqui o texto de destaque.';
    document.execCommand('insertHTML', false, `<div class="highlight"><strong>${escapeHtml(text)}</strong></div><p><br></p>`);
    return;
  }
  document.execCommand(button.dataset.format, false, button.dataset.value || null);
}

elements.loginForm.addEventListener('submit', login);
$('#checkSetup').addEventListener('click', checkSession);
$('#logoutButton').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => {}); showLogin(false); });
$('#newPostTop').addEventListener('click', () => openEditor());
$('#newPostSide').addEventListener('click', () => openEditor());
$('#backToPosts').addEventListener('click', showPosts);
$('#menuToggle').addEventListener('click', () => $('.app').classList.toggle('menu-open'));
$('#postSearch').addEventListener('input', renderPosts);
$('#postForm').addEventListener('submit', (event) => { event.preventDefault(); save('publish'); });
$('#saveDraftButton').addEventListener('click', () => save('draft'));
$('#previewButton').addEventListener('click', preview);
$('#closePreview').addEventListener('click', () => elements.previewModal.close());
$('#coverImage').addEventListener('change', selectImage);
$('#changeImage').addEventListener('click', () => $('#coverImage').click());
$('#postTitle').addEventListener('input', (event) => {
  if (state.autoSlug) $('#postSlug').value = slugify(event.target.value);
  if (!$('#seoTitle').dataset.edited) $('#seoTitle').value = event.target.value.slice(0, 70);
  updateCounters();
});
$('#postSlug').addEventListener('input', (event) => { state.autoSlug = false; event.target.value = slugify(event.target.value); });
$('#postExcerpt').addEventListener('input', (event) => {
  if (!$('#seoDescription').dataset.edited) $('#seoDescription').value = event.target.value.slice(0, 170);
  updateCounters();
});
$('#seoTitle').addEventListener('input', (event) => { event.target.dataset.edited = 'true'; updateCounters(); });
$('#seoDescription').addEventListener('input', (event) => { event.target.dataset.edited = 'true'; updateCounters(); });
$$('.toolbar button').forEach((button) => button.addEventListener('click', () => applyFormat(button)));
elements.postsList.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit]');
  const remove = event.target.closest('[data-delete]');
  if (edit) openEditor(state.posts.find((post) => post.id === edit.dataset.edit));
  if (remove) removePost(remove.dataset.delete);
});

checkSession();
