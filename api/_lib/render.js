const SITE_URL = 'https://ativadigitalon.com.br';
const WHATSAPP = '5589981311034';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function sanitizeHtml(value = '') {
  let html = String(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '');

  const allowed = /^(p|h2|h3|ul|ol|li|strong|b|em|i|a|blockquote|br|div)$/i;
  html = html.replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (tag, name, attributes) => {
    if (!allowed.test(name)) return '';
    const closing = tag.startsWith('</');
    if (closing) return `</${name.toLowerCase()}>`;
    const lower = name.toLowerCase();
    if (lower === 'br') return '<br>';
    if (lower === 'div') return /class\s*=\s*["']highlight["']/i.test(attributes) ? '<div class="highlight">' : '<div>';
    if (lower === 'a') {
      const href = attributes.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] || '';
      const safeHref = /^(https?:\/\/|mailto:|tel:|#)/i.test(href) ? href : '#';
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${lower}>`;
  });
  return html.trim();
}

function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(parsed);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function articleHeader() {
  return `<header class="top"><a class="brand" href="../"><img src="../logo.svg" alt="Logo Ativa Digital ON"><span><strong>Ativa Digital <b>ON</b></strong><small>TECNOLOGIA E ESTRATÉGIA PARA EMPRESAS</small></span></a><nav class="nav" aria-label="Navegação do artigo"><a href="./">Blog</a><a href="../">Site principal</a></nav><a class="btn primary" href="https://wa.me/${WHATSAPP}?text=Olá!%20Quero%20melhorar%20a%20presença%20digital%20da%20minha%20empresa." target="_blank" rel="noopener noreferrer">Falar com a Ativa →</a></header>`;
}

function articleFooter() {
  return `<footer class="footer"><div class="wrap footer-main"><div><a class="brand" href="../"><img src="../logo.svg" alt=""><span><strong>Ativa Digital <b>ON</b></strong><small>PRESENÇA DIGITAL PRONTA PARA VENDER</small></span></a><p>© 2026 Ativa Digital ON.</p></div><div class="social"><a href="./">Blog</a><a href="../">Site principal</a><a href="https://instagram.com/ativadigitalon" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div></div></footer><a class="wa" href="https://wa.me/${WHATSAPP}?text=Olá!%20Encontrei%20a%20Ativa%20pelo%20blog." target="_blank" rel="noopener noreferrer">WhatsApp</a>`;
}

function renderArticle(post, posts) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.seoDescription || post.excerpt);
  const category = escapeHtml(post.category);
  const lead = escapeHtml(post.lead || post.excerpt);
  const imagePath = escapeHtml(post.imagePath);
  const imageUrl = `${SITE_URL}/${post.imagePath}`;
  const articleUrl = `${SITE_URL}/blog/${post.slug}.html`;
  const related = posts.filter((item) => item.slug !== post.slug && item.status === 'published').slice(0, 3);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: imageUrl,
    author: { '@type': 'Organization', name: 'Ativa Digital ON' },
    publisher: { '@type': 'Organization', name: 'Ativa Digital ON', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` } },
    mainEntityOfPage: articleUrl
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4ZJG8BBWVZ"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4ZJG8BBWVZ');</script>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#050505">
  <title>${escapeHtml(post.seoTitle || post.title)}</title>
  <link rel="icon" href="../logo.svg" type="image/svg+xml"><link rel="canonical" href="${articleUrl}"><link rel="stylesheet" href="./styles.css"><link rel="stylesheet" href="./images.css">
  <meta property="og:locale" content="pt_BR"><meta property="og:type" content="article"><meta property="og:site_name" content="Ativa Digital ON"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${articleUrl}"><meta property="og:image" content="${imageUrl}"><meta property="og:image:alt" content="${escapeHtml(post.imageAlt)}">
  <script type="application/ld+json">${safeJson(schema)}</script>
</head>
<body>
${articleHeader()}
<main>
  <section class="article-hero"><div class="wrap"><div class="breadcrumb"><a href="./">Blog</a> / ${category}</div><div class="meta" style="margin-top:24px"><span>${category}</span><span>•</span><span>${escapeHtml(formatDate(post.publishedAt))}</span><span>•</span><span>${Number(post.readTime) || 5} min de leitura</span></div><h1>${title}</h1><p class="lead">${lead}</p><figure class="article-cover"><img src="../${imagePath}" alt="${escapeHtml(post.imageAlt)}" width="1400" height="788" fetchpriority="high"></figure></div></section>
  <div class="wrap article-layout">
    <article class="article-content">
      ${sanitizeHtml(post.contentHtml)}
      <div class="article-cta"><h3>Quer fortalecer a presença digital da sua empresa?</h3><p>A Ativa Digital ON cria páginas profissionais para apresentar serviços, diferenciais e contato direto pelo WhatsApp.</p><a class="btn primary" href="https://wa.me/${WHATSAPP}?text=Olá!%20Li%20uma%20matéria%20no%20blog%20e%20quero%20melhorar%20a%20presença%20digital%20da%20minha%20empresa." target="_blank" rel="noopener noreferrer">Conversar com a Ativa →</a></div>
    </article>
    <aside class="sidebar"><div class="sidebox"><h3>Conteúdos relacionados</h3>${related.map((item) => `<a href="./${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}</a>`).join('')}</div><div class="sidebox"><h3>Fortaleça sua presença digital</h3><p>Apresente sua empresa com clareza, confiança e contato direto.</p><a class="btn primary full" href="../#oferta">Conhecer soluções</a></div></aside>
  </div>
</main>
${articleFooter()}
</body></html>`;
}

function card(post, index) {
  return `<article class="card"><a href="./${escapeHtml(post.slug)}.html"><div class="card-visual"><img src="../${escapeHtml(post.imagePath)}" alt="${escapeHtml(post.imageAlt)}" width="1400" height="788" loading="lazy"><span>${String(index + 1).padStart(2, '0')}</span></div><div class="card-copy"><div class="meta"><span>${escapeHtml(post.category)}</span><span>${Number(post.readTime) || 5} min</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt)}</p><span class="read">Ler artigo →</span></div></a></article>`;
}

function renderBlogIndex(allPosts) {
  const posts = allPosts.filter((post) => post.status === 'published');
  const featured = posts.find((post) => post.featured) || posts[0];
  const remaining = posts.filter((post) => post.slug !== featured?.slug);
  const featuredHtml = featured ? `<article class="featured"><div class="featured-visual"><img src="../${escapeHtml(featured.imagePath)}" alt="${escapeHtml(featured.imageAlt)}" width="1400" height="788" fetchpriority="high"><span class="image-label">Destaque</span></div><div class="featured-copy"><div class="meta"><span>${escapeHtml(featured.category)}</span><span>•</span><span>${Number(featured.readTime) || 5} min de leitura</span></div><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.excerpt)}</p><a class="read" href="./${escapeHtml(featured.slug)}.html">Ler artigo completo →</a></div></article>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4ZJG8BBWVZ"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4ZJG8BBWVZ');</script>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="Tecnologia, presença digital, Google, sites e estratégias práticas para pequenas empresas venderem e se apresentarem melhor na internet."><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#050505"><title>Blog Ativa Digital ON | Tecnologia e estratégias para empresas</title>
  <link rel="icon" href="../logo.svg" type="image/svg+xml"><link rel="canonical" href="${SITE_URL}/blog/"><link rel="stylesheet" href="./styles.css"><link rel="stylesheet" href="./images.css"><meta property="og:locale" content="pt_BR"><meta property="og:type" content="website"><meta property="og:site_name" content="Ativa Digital ON"><meta property="og:title" content="Blog Ativa Digital ON | Tecnologia e estratégias para empresas"><meta property="og:description" content="Conteúdos práticos para empresas que querem fortalecer sua presença digital, melhorar o atendimento e conquistar mais clientes."><meta property="og:url" content="${SITE_URL}/blog/"><meta property="og:image" content="${SITE_URL}/assets/og-ativa-digital-on.jpg"><script type="application/ld+json">${safeJson({ '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog Ativa Digital ON', url: `${SITE_URL}/blog/`, description: 'Tecnologia e estratégias digitais para pequenas empresas.', publisher: { '@type': 'Organization', name: 'Ativa Digital ON', url: `${SITE_URL}/`, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` } } })}</script>
</head>
<body>
<header class="top"><a class="brand" href="../"><img src="../logo.svg" alt="Logo Ativa Digital ON"><span><strong>Ativa Digital <b>ON</b></strong><small>TECNOLOGIA E ESTRATÉGIA PARA EMPRESAS</small></span></a><nav class="nav" aria-label="Navegação do blog"><a href="./">Início</a><a href="#artigos">Artigos</a><a href="../">Site principal</a></nav><a class="btn primary" href="https://wa.me/${WHATSAPP}?text=Olá!%20Encontrei%20a%20Ativa%20Digital%20ON%20pelo%20blog%20e%20quero%20melhorar%20a%20presença%20digital%20da%20minha%20empresa." target="_blank" rel="noopener noreferrer">Falar com a Ativa →</a></header>
<main>
  <section class="hero"><div class="wrap"><span class="eyebrow">Blog Ativa Digital ON</span><h1>Estratégias para colocar sua empresa no modo <strong>ON.</strong></h1><p>Conteúdos claros e práticos sobre sites, Google, WhatsApp, tecnologia e presença digital para empresas que querem transmitir confiança e conquistar mais oportunidades.</p><div class="hero-actions"><a class="btn primary" href="#artigos">Explorar conteúdos ↓</a><a class="btn outline" href="../">Conhecer nossos serviços</a></div></div></section>
  <section class="section wrap" id="artigos"><div class="section-head"><div><span class="tag">Conteúdo em destaque</span><h2>Antes de comprar, o cliente pesquisa.</h2></div><p>Entenda como sua empresa é percebida na internet e transforme cada ponto de contato em uma oportunidade.</p></div>${featuredHtml}<div class="cards">${remaining.map(card).join('')}</div></section>
  <section class="section wrap"><div class="newsletter"><div><span class="tag">Diagnóstico digital</span><h2>Sua empresa transmite confiança quando alguém encontra você online?</h2><p>Converse com a Ativa Digital ON e descubra quais pontos podem ser melhorados na apresentação digital do seu negócio.</p></div><a class="btn primary" href="https://wa.me/${WHATSAPP}?text=Olá!%20Quero%20uma%20análise%20da%20presença%20digital%20da%20minha%20empresa." target="_blank" rel="noopener noreferrer">Solicitar análise →</a></div></section>
</main>
<footer class="footer"><div class="wrap footer-main"><div><a class="brand" href="../"><img src="../logo.svg" alt=""><span><strong>Ativa Digital <b>ON</b></strong><small>PRESENÇA DIGITAL PRONTA PARA VENDER</small></span></a><p>© 2026 Ativa Digital ON. Todos os direitos reservados.</p></div><div class="social"><a href="../">Site principal</a><a href="https://instagram.com/ativadigitalon" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div></div></footer><a class="wa" href="https://wa.me/${WHATSAPP}?text=Olá!%20Encontrei%20a%20Ativa%20pelo%20blog." target="_blank" rel="noopener noreferrer">WhatsApp</a>
</body></html>`;
}

function renderSitemap(posts) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/blog/`, priority: '0.9' },
    ...posts.filter((post) => post.status === 'published').map((post) => ({
      loc: `${SITE_URL}/blog/${post.slug}.html`,
      lastmod: post.updatedAt || post.publishedAt,
      priority: '0.8'
    }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${escapeHtml(url.loc)}</loc>${url.lastmod ? `\n    <lastmod>${escapeHtml(url.lastmod)}</lastmod>` : ''}\n    <changefreq>weekly</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

function extractContent(articleHtml = '') {
  const match = articleHtml.match(/<article class="article-content">([\s\S]*?)<div class="article-cta">/i);
  return match ? match[1].trim() : '';
}

function normalizePost(input, existing = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(input.slug || input.title);
  return {
    ...existing,
    id: existing.id || slug,
    slug,
    title: stripHtml(input.title).slice(0, 140),
    category: stripHtml(input.category).slice(0, 50),
    excerpt: stripHtml(input.excerpt).slice(0, 320),
    lead: stripHtml(input.lead || input.excerpt).slice(0, 500),
    readTime: Math.max(1, Math.min(60, Number(input.readTime) || 5)),
    publishedAt: existing.publishedAt || input.publishedAt || today,
    updatedAt: today,
    imagePath: input.imagePath || existing.imagePath || '',
    imageAlt: stripHtml(input.imageAlt || input.title).slice(0, 180),
    seoTitle: stripHtml(input.seoTitle || input.title).slice(0, 70),
    seoDescription: stripHtml(input.seoDescription || input.excerpt).slice(0, 170),
    featured: Boolean(input.featured),
    status: input.status === 'published' ? 'published' : 'draft',
    contentHtml: sanitizeHtml(input.contentHtml)
  };
}

function validatePost(post, requireImage = true) {
  const errors = [];
  if (post.title.length < 8) errors.push('Informe um título com pelo menos 8 caracteres.');
  if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) errors.push('O endereço da matéria é inválido.');
  if (post.category.length < 2) errors.push('Informe a categoria.');
  if (post.excerpt.length < 30) errors.push('O resumo precisa ter pelo menos 30 caracteres.');
  if (post.contentHtml.length < 80) errors.push('O conteúdo da matéria está muito curto.');
  if (requireImage && !post.imagePath) errors.push('Escolha uma imagem de capa.');
  return errors;
}

module.exports = {
  extractContent,
  normalizePost,
  renderArticle,
  renderBlogIndex,
  renderSitemap,
  sanitizeHtml,
  slugify,
  validatePost
};
