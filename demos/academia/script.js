const q=s=>document.querySelector(s),qa=s=>document.querySelectorAll(s);

// Garante que o item Início apareça mesmo quando o HTML antigo estiver em cache.
const menu=q('#menu');
if(menu && !menu.querySelector('a[href="#inicio"]')){
  const home=document.createElement('a');
  home.href='#inicio';
  home.textContent='Início';
  home.className='home-link';
  menu.prepend(home);
}

q('#toggle').onclick=()=>q('#menu').classList.toggle('open');
qa('#menu a').forEach(a=>a.onclick=()=>q('#menu').classList.remove('open'));
addEventListener('scroll',()=>q('#progress').style.width=(scrollY/(document.documentElement.scrollHeight-innerHeight)*100)+'%');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.12});
qa('.reveal').forEach(x=>io.observe(x));
const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const x=e.target,t=+x.dataset.count,st=performance.now();function run(n){let p=Math.min((n-st)/1300,1),v=Math.floor(t*(1-Math.pow(1-p,3)));x.textContent=(x.dataset.prefix||'')+(x.dataset.format?v.toLocaleString('pt-BR'):v)+(x.dataset.suffix||'');if(p<1)requestAnimationFrame(run)}requestAnimationFrame(run);co.unobserve(x)}),{threshold:.4});
qa('[data-count]').forEach(x=>co.observe(x));
const gd={emagrecer:['Emagrecimento com consistência','Musculação, cardio orientado e acompanhamento para evoluir com segurança.','emagrecer'],massa:['Hipertrofia com estratégia','Treino de força progressivo e orientação para ganhar massa muscular.','ganhar massa muscular'],condicionamento:['Mais fôlego e desempenho','Cardio, funcional e musculação para melhorar resistência e disposição.','melhorar meu condicionamento'],sedentarismo:['Começo seguro e gradual','Uma rotina adaptada ao seu nível para transformar exercício em hábito.','sair do sedentarismo']};
qa('.goal-btn').forEach(b=>b.onclick=()=>{qa('.goal-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');let d=gd[b.dataset.goal];q('#goalTitle').textContent=d[0];q('#goalText').textContent=d[1];q('#goalLink').href='https://wa.me/5589981311034?text='+encodeURIComponent('Olá! Meu objetivo é '+d[2]+'.')});
qa('.tab').forEach(b=>b.onclick=()=>{qa('.tab,.day').forEach(x=>x.classList.remove('active'));b.classList.add('active');q('#'+b.dataset.day).classList.add('active')});
q('#trialForm').onsubmit=e=>{e.preventDefault();let txt=`Olá! Quero agendar uma aula experimental grátis.\n\nNome: ${q('#name').value}\nTelefone: ${q('#phone').value}\nObjetivo: ${q('#goal').value}\nMelhor horário: ${q('#period').value}`;open('https://wa.me/5589981311034?text='+encodeURIComponent(txt),'_blank')};