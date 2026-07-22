const toggle=document.getElementById('searchToggle');
const panel=document.getElementById('searchPanel');
const input=document.getElementById('newsSearch');

const FALLBACK_IMAGE='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ececea"/><stop offset="1" stop-color="#d7d7d3"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><g fill="#777" font-family="Arial, sans-serif" text-anchor="middle"><text x="400" y="215" font-size="34" font-weight="700">PORTAL SERRA ATUAL</text><text x="400" y="260" font-size="20">Imagem indisponível</text></g></svg>`);

function applyImageFallbacks(root=document){
  root.querySelectorAll('img').forEach(img=>{
    if(img.dataset.fallbackReady)return;
    img.dataset.fallbackReady='1';
    img.addEventListener('error',()=>{
      if(img.src===FALLBACK_IMAGE)return;
      img.classList.add('image-fallback');
      img.src=FALLBACK_IMAGE;
    });
  });
}

toggle?.addEventListener('click',()=>{
  panel.classList.toggle('open');
  if(panel.classList.contains('open'))input.focus();
});

input?.addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll('.news-card').forEach(card=>{
    const t=((card.dataset.search||'')+' '+card.innerText).toLowerCase();
    card.style.display=q&&!t.includes(q)?'none':'';
  });
});

document.querySelectorAll('[data-category]').forEach(link=>{
  link.href='categoria.html?slug='+encodeURIComponent(link.dataset.category);
});

applyImageFallbacks();

const marquee=document.querySelector('.logo-track');
if(marquee){
  marquee.style.animationPlayState='running';
  ['mouseenter','mouseleave','touchstart','touchend','pointerenter','pointerleave'].forEach(eventName=>{
    marquee.addEventListener(eventName,()=>{marquee.style.animationPlayState='running';},{passive:true});
  });
}