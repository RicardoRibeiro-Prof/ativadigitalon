const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navigation.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
}

const searchInput = document.querySelector('#busca');
const filterButtons = [...document.querySelectorAll('.filter-button')];
const cards = [...document.querySelectorAll('.article-card')];
const emptyState = document.querySelector('#sem-resultados');
const resultCount = document.querySelector('#resultados-contagem');
const clearSearchButton = document.querySelector('[data-clear-search]');
let activeCategory = 'todos';
const requestedCategory = new URLSearchParams(window.location.search).get('categoria');

if (requestedCategory && filterButtons.some((button) => button.dataset.filter === requestedCategory)) {
  activeCategory = requestedCategory;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === requestedCategory;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function filterArticles() {
  const term = normalizeText(searchInput?.value || '');
  let visible = 0;

  cards.forEach((card) => {
    const matchesCategory = activeCategory === 'todos' || card.dataset.category === activeCategory;
    const searchable = normalizeText(`${card.dataset.search || ''} ${card.textContent}`);
    const matchesSearch = !term || searchable.includes(term);
    const shouldShow = matchesCategory && matchesSearch;
    card.hidden = !shouldShow;
    if (shouldShow) visible += 1;
  });

  if (emptyState) emptyState.hidden = visible !== 0;
  if (resultCount) resultCount.textContent = `${visible} ${visible === 1 ? 'artigo encontrado' : 'artigos encontrados'}`;
  if (clearSearchButton) clearSearchButton.hidden = !term;
}

function updateCategoryUrl() {
  const url = new URL(window.location.href);
  if (activeCategory === 'todos') url.searchParams.delete('categoria');
  else url.searchParams.set('categoria', activeCategory);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter || 'todos';
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
    updateCategoryUrl();
    filterArticles();
  });
});

searchInput?.addEventListener('input', filterArticles);
searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && searchInput.value) {
    searchInput.value = '';
    filterArticles();
  }
});
clearSearchButton?.addEventListener('click', () => {
  if (!searchInput) return;
  searchInput.value = '';
  searchInput.focus();
  filterArticles();
});
if (cards.length) filterArticles();

const article = document.querySelector('.article-body');
const progressBar = document.querySelector('.reading-progress span');

function updateReadingProgress() {
  if (!article || !progressBar) return;
  const articleTop = article.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(article.offsetHeight - window.innerHeight, 1);
  const progress = Math.min(100, Math.max(0, ((window.scrollY - articleTop + 120) / scrollable) * 100));
  progressBar.style.width = `${progress}%`;
}

if (article && progressBar) {
  updateReadingProgress();
  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('resize', updateReadingProgress);
}

const pageUrl = encodeURIComponent(window.location.href);
const pageTitle = encodeURIComponent(document.title.replace(' — Código em Sala', ''));

document.querySelectorAll('[data-share="whatsapp"]').forEach((link) => {
  link.href = `https://wa.me/?text=${pageTitle}%20${pageUrl}`;
});

document.querySelectorAll('[data-share="facebook"]').forEach((link) => {
  link.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
});

document.querySelectorAll('[data-share="native"]').forEach((button) => {
  if (!navigator.share) {
    button.hidden = true;
    return;
  }
  button.addEventListener('click', () => navigator.share({ title: document.title, url: window.location.href }).catch(() => {}));
});

if (!document.querySelector('#aviso-cookies')) {
  document.body.insertAdjacentHTML('beforeend', `
    <aside id="aviso-cookies" class="cookie-banner" aria-label="Preferências de cookies" aria-live="polite">
      <p><strong>Cookies e privacidade</strong>Usamos apenas o armazenamento necessário para lembrar sua escolha. Recursos de análise e publicidade só serão ativados de acordo com esta preferência. <a href="${document.body.dataset.article === 'true' ? '../' : ''}privacidade.html">Saiba mais</a>.</p>
      <div class="cookie-actions">
        <button class="cookie-button" type="button" data-cookie-choice="essenciais">Somente essenciais</button>
        <button class="cookie-button primary" type="button" data-cookie-choice="aceitos">Aceitar</button>
      </div>
    </aside>`);
}

const cookieBanner = document.querySelector('#aviso-cookies');
const cookieChoice = localStorage.getItem('codigo-em-sala-cookies');

if (cookieBanner && !cookieChoice) cookieBanner.classList.add('open');

document.querySelectorAll('[data-cookie-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    localStorage.setItem('codigo-em-sala-cookies', button.dataset.cookieChoice);
    cookieBanner?.classList.remove('open');
  });
});

document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
  button.addEventListener('click', () => cookieBanner?.classList.add('open'));
});
