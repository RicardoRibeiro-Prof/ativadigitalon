const DATA=[
{category:'cidade',title:'Novas ações fortalecem o turismo na região',text:'Municípios se unem em agenda de desenvolvimento e valorização do patrimônio local.',image:'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=85'},
{category:'politica',title:'Câmara debate novos projetos para o município',text:'Sessão reúne propostas voltadas à administração pública e aos serviços locais.',image:'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1000&q=85'},
{category:'policia',title:'Ações de segurança são reforçadas na região',text:'Operações preventivas ampliam o patrulhamento e a orientação à população.',image:'https://images.unsplash.com/photo-1453873531674-2151bcd01707?auto=format&fit=crop&w=1000&q=85'},
{category:'saude',title:'Unidades de saúde ampliam horários de atendimento',text:'Medida busca reduzir filas e atender demandas acumuladas.',image:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=85'},
{category:'educacao',title:'Escolas anunciam novas vagas para cursos técnicos',text:'Programação inclui tecnologia e preparação profissional.',image:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=85'},
{category:'esportes',title:'Campeonato regional movimenta torcidas e comércio',text:'Competição reúne equipes de vários municípios.',image:'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1000&q=85'},
{category:'economia',title:'Comércio local registra novas oportunidades',text:'Empresas ampliam serviços e criam vagas em diferentes setores.',image:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85'},
{category:'cultura',title:'Agenda cultural reúne música, arte e eventos',text:'Programação valoriza artistas e iniciativas regionais.',image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85'},
{category:'tecnologia',title:'Empresas locais começam a adotar inteligência artificial',text:'Tecnologia começa a transformar processos e atendimento.',image:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=85'}
];

const names={cidade:'Cidade',politica:'Política',policia:'Polícia',saude:'Saúde',educacao:'Educação',esportes:'Esportes',economia:'Economia',cultura:'Cultura',tecnologia:'Tecnologia'};
const slug=new URLSearchParams(location.search).get('slug')||'cidade';
const title=names[slug]||'Notícias';
const FALLBACK_IMAGE='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ececea"/><stop offset="1" stop-color="#d7d7d3"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><g fill="#777" font-family="Arial, sans-serif" text-anchor="middle"><text x="400" y="215" font-size="34" font-weight="700">PORTAL SERRA ATUAL</text><text x="400" y="260" font-size="20">Imagem indisponível</text></g></svg>`);

document.title=title+' | Portal Serra Atual';
document.getElementById('categoryTitle').textContent=title;
document.getElementById('breadcrumbCategory').textContent=title;

document.querySelectorAll('[data-category]').forEach(a=>{
  a.href='categoria.html?slug='+a.dataset.category;
  a.classList.toggle('active',a.dataset.category===slug);
});

const items=DATA.filter(n=>n.category===slug);
const container=document.getElementById('categoryNews');
container.innerHTML=items.length?items.concat(items,items).slice(0,6).map((n,i)=>`<article class="category-card"><img src="${n.image}" alt="Imagem da notícia: ${n.title}" loading="lazy"><div><span class="tag">${title}</span><h2>${n.title}${i?` — atualização ${i+1}`:''}</h2><p>${n.text}</p><small>Há ${i+1} hora(s)</small></div></article>`).join(''):'<div class="empty">Nenhuma notícia publicada nesta categoria.</div>';

container.querySelectorAll('img').forEach(img=>{
  img.addEventListener('error',()=>{
    if(img.src===FALLBACK_IMAGE)return;
    img.classList.add('image-fallback');
    img.src=FALLBACK_IMAGE;
  });
});