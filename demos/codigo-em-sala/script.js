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
let activeCategory = 'todos';

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
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter || 'todos';
    filterButtons.forEach((item) => item.classList.toggle('active', item === button));
    filterArticles();
  });
});

searchInput?.addEventListener('input', filterArticles);
