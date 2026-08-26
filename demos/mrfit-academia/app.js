const loader=document.querySelector('.loader');
window.addEventListener('load',()=>setTimeout(()=>loader?.classList.add('done'),500));

const header=document.querySelector('.header');
const progress=document.querySelector('.progress');
window.addEventListener('scroll',()=>{
  header?.classList.toggle('scrolled',window.scrollY>24);
  const h=document.documentElement.scrollHeight-window.innerHeight;
  if(progress) progress.style.width=(h?window.scrollY/h*100:0)+'%';
});

const menuBtn=document.querySelector('.menu'), mobile=document.querySelector('.mobile-menu');
menuBtn?.addEventListener('click',()=>mobile.classList.toggle('open'));
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>mobile.classList.remove('open')));

const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el=>io.observe(el));

document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));
document.querySelectorAll('form[data-demo]').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault(); const s=form.querySelector('.status'); if(s)s.style.display='block'; const b=form.querySelector('button'); if(b)b.textContent='Cadastro realizado';
}));

// custom cursor and spotlight cards
const cursor=document.querySelector('.cursor');
if(cursor && window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});
  document.querySelectorAll('a,button,.feature-card,.shot,.visual-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>cursor.classList.add('hot'));
    el.addEventListener('mouseleave',()=>cursor.classList.remove('hot'));
  });
}
document.querySelectorAll('.feature-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')});
});

// seamless ticker
(function(){
  const track = document.getElementById('kineticTrack');
  if(!track) return;
  const groups = track.querySelectorAll('.kinetic-group');
  if(!groups.length) return;
  const first = groups[0];
  const setTicker = ()=>{
    const w = first.getBoundingClientRect().width;
    track.style.setProperty('--ticker-width', `${w}px`);
    const speed = Math.max(14, Math.round(w / 70));
    track.style.setProperty('--ticker-speed', `${speed}s`);
  };
  setTicker();
  window.addEventListener('resize', setTicker);
})();

// back to top
const backToTop = document.querySelector('.back-to-top');
if(backToTop){
  const toggleBackToTop = () => backToTop.classList.toggle('show', window.scrollY > 520);
  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, {passive:true});
  backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
}
