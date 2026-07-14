document.addEventListener('DOMContentLoaded',()=>{
  const siteUrl='https://ativadigitalon.com.br/';
  const title='Criação de Sites e Páginas de Vendas | AtivaDigitalOn';
  const description='Criação de sites, páginas de apresentação, páginas de vendas, catálogos e portfólios digitais para pequenos negócios. Atendimento em São Raimundo Nonato e em todo o Brasil.';
  const imageUrl=`${siteUrl}logo.svg`;

  document.title=title;
  const setMeta=(selector,attrs)=>{
    let tag=document.head.querySelector(selector);
    if(!tag){tag=document.createElement('meta');document.head.appendChild(tag)}
    Object.entries(attrs).forEach(([key,value])=>tag.setAttribute(key,value));
  };
  const setLink=(rel,href)=>{
    let tag=document.head.querySelector(`link[rel="${rel}"]`);
    if(!tag){tag=document.createElement('link');tag.rel=rel;document.head.appendChild(tag)}
    tag.href=href;
  };

  setMeta('meta[name="description"]',{name:'description',content:description});
  setMeta('meta[name="robots"]',{name:'robots',content:'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'});
  setMeta('meta[name="author"]',{name:'author',content:'AtivaDigitalOn'});
  setMeta('meta[name="geo.region"]',{name:'geo.region',content:'BR-PI'});
  setMeta('meta[name="geo.placename"]',{name:'geo.placename',content:'São Raimundo Nonato'});
  setMeta('meta[property="og:type"]',{property:'og:type',content:'website'});
  setMeta('meta[property="og:locale"]',{property:'og:locale',content:'pt_BR'});
  setMeta('meta[property="og:site_name"]',{property:'og:site_name',content:'AtivaDigitalOn'});
  setMeta('meta[property="og:title"]',{property:'og:title',content:title});
  setMeta('meta[property="og:description"]',{property:'og:description',content:description});
  setMeta('meta[property="og:url"]',{property:'og:url',content:siteUrl});
  setMeta('meta[property="og:image"]',{property:'og:image',content:imageUrl});
  setMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
  setMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
  setMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
  setMeta('meta[name="twitter:image"]',{name:'twitter:image',content:imageUrl});
  setLink('canonical',siteUrl);

  if(!document.head.querySelector('#local-business-schema')){
    const schema=document.createElement('script');
    schema.id='local-business-schema';
    schema.type='application/ld+json';
    schema.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@type':'ProfessionalService',
      name:'AtivaDigitalOn',
      url:siteUrl,
      logo:imageUrl,
      image:imageUrl,
      description,
      telephone:'+55 89 98131-1034',
      address:{'@type':'PostalAddress',addressLocality:'São Raimundo Nonato',addressRegion:'PI',addressCountry:'BR'},
      areaServed:['São Raimundo Nonato','Piauí','Brasil'],
      sameAs:['https://www.instagram.com/ativadigitalon/'],
      contactPoint:{'@type':'ContactPoint',telephone:'+55 89 98131-1034',contactType:'sales',availableLanguage:'Portuguese'},
      hasOfferCatalog:{'@type':'OfferCatalog',name:'Serviços digitais',itemListElement:[
        {'@type':'Offer',itemOffered:{'@type':'Service',name:'Página de apresentação'}},
        {'@type':'Offer',itemOffered:{'@type':'Service',name:'Página de vendas'}},
        {'@type':'Offer',itemOffered:{'@type':'Service',name:'Catálogo digital'}},
        {'@type':'Offer',itemOffered:{'@type':'Service',name:'Portfólio profissional'}}
      ]}
    });
    document.head.appendChild(schema);
  }

  document.querySelectorAll('img[src="logo.jpg"]').forEach(img=>{
    img.src='./logo.svg';
    img.alt='Logo da AtivaDigitalOn';
  });

  const mainNav=document.querySelector('.links');
  if(mainNav && ![...mainNav.querySelectorAll('a')].some(link=>link.textContent.trim().toLowerCase()==='início')){
    const homeLink=document.createElement('a');
    homeLink.href='#inicio';
    homeLink.textContent='Início';
    homeLink.setAttribute('aria-label','Voltar ao início da página');
    mainNav.prepend(homeLink);
  }

  const contactItems=document.querySelectorAll('.contact-box > div');
  contactItems.forEach(item=>{
    const label=item.querySelector('strong')?.textContent?.trim().toLowerCase();
    if(label==='whatsapp'){
      item.innerHTML='<strong>WhatsApp</strong><br><a class="contact-clickable" href="https://wa.me/5589981311034?text=Olá!%20Vim%20pelo%20site%20da%20AtivaDigitalOn%20e%20quero%20uma%20página%20para%20meu%20negócio." target="_blank" rel="noopener noreferrer" aria-label="Conversar com a AtivaDigitalOn pelo WhatsApp">(89) 98131-1034 <span aria-hidden="true">↗</span></a>';
    }
    if(label==='instagram'){
      item.innerHTML='<strong>Instagram</strong><br><a class="contact-clickable" href="https://www.instagram.com/ativadigitalon/" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram da AtivaDigitalOn">@ativadigitalon <span aria-hidden="true">↗</span></a>';
    }
  });

  const footer=document.querySelector('.footer');
  if(footer){
    footer.innerHTML=`
      <div class="container footer-main">
        <div class="footer-brand-block">
          <a class="footer-brand-link" href="#inicio" aria-label="Voltar ao início">
            <img src="./logo.svg" alt="Logo da AtivaDigitalOn">
            <div><strong>AtivaDigitalOn</strong><span>Presença digital pronta para vender</span></div>
          </a>
          <p>Criamos páginas profissionais para ajudar pequenos negócios a apresentar melhor seus serviços, fortalecer sua marca e gerar mais contatos pelo WhatsApp.</p>
        </div>
        <div class="footer-column"><h2>Serviços</h2><a href="#servicos">Página de apresentação</a><a href="#servicos">Página de vendas</a><a href="#servicos">Catálogo digital</a><a href="#portfolio">Portfólio profissional</a></div>
        <div class="footer-column"><h2>Contato</h2><a href="https://wa.me/5589981311034?text=Olá!%20Quero%20uma%20página%20profissional%20para%20meu%20negócio." target="_blank" rel="noopener noreferrer">(89) 98131-1034 ↗</a><a href="https://www.instagram.com/ativadigitalon/" target="_blank" rel="noopener noreferrer">@ativadigitalon ↗</a><span>Atendimento remoto</span><span>São Raimundo Nonato – PI</span></div>
      </div>
      <div class="container footer-bottom-new"><span>© 2026 AtivaDigitalOn. Todos os direitos reservados.</span><span>Design, estratégia e presença digital.</span></div>`;
  }

  const style=document.createElement('style');
  style.textContent=`
    .brand img,.screen-logo{object-fit:contain!important;background:#050505!important;padding:0!important}.brand img{border:1px solid rgba(255,189,0,.5)!important;box-shadow:0 0 0 4px rgba(255,115,0,.08)}.screen-logo{border:1px solid rgba(255,189,0,.35)}.contact-clickable{display:inline-flex;align-items:center;gap:7px;color:#fff;text-decoration:none;font-weight:600;margin-top:4px;transition:color .2s ease,transform .2s ease}.contact-clickable span{color:#ff9a00;font-size:14px}.contact-clickable:hover,.contact-clickable:focus-visible{color:#ffbd00;transform:translateX(2px)}.contact-clickable:focus-visible{outline:2px solid #ffbd00;outline-offset:4px;border-radius:4px}.footer{background:linear-gradient(180deg,#0b0b0b 0%,#050505 100%)!important;border-top:1px solid rgba(255,115,0,.24)!important;padding:58px 0 24px!important;color:#fff!important}.footer-main{display:grid;grid-template-columns:1.45fr .8fr .8fr;gap:52px;align-items:start}.footer-brand-link{display:flex;align-items:center;gap:15px;margin-bottom:18px;text-decoration:none}.footer-brand-link img{width:64px;height:64px;object-fit:contain;background:#050505;border-radius:50%;border:1px solid rgba(255,189,0,.5)}.footer-brand-link strong{display:block;font-size:22px;color:#fff;line-height:1.1}.footer-brand-link span{display:block;color:#ffbd00;font-size:10px;text-transform:uppercase;letter-spacing:.15em;margin-top:6px}.footer-brand-block p{max-width:520px;color:#a9a9a9;line-height:1.75}.footer-column{display:grid;gap:10px;align-content:start}.footer-column h2{font-size:13px;text-transform:uppercase;letter-spacing:.18em;color:#ffbd00;margin-bottom:8px}.footer-column a,.footer-column span{color:#c9c9c9;font-size:14px;text-decoration:none}.footer-column a:hover,.footer-column a:focus-visible{color:#ff7300}.footer-bottom-new{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);margin-top:42px;padding-top:22px;color:#858585;font-size:12px}@media(max-width:820px){.footer-main{grid-template-columns:1fr 1fr}.footer-brand-block{grid-column:1/-1}}@media(max-width:560px){.footer-main{grid-template-columns:1fr;gap:32px}.footer-brand-block{grid-column:auto}.footer-bottom-new{flex-direction:column}.footer{padding-bottom:90px!important}}
  `;
  document.head.appendChild(style);

  /* Animações: nenhum texto, imagem, estrutura ou dimensão do layout é alterado. */
  const animationStyle=document.createElement('style');
  animationStyle.id='ativadigitalon-animations';
  animationStyle.textContent=`
    @keyframes ativaHeaderIn{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}}
    @keyframes ativaHeroIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
    @keyframes ativaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes ativaPulse{0%,100%{box-shadow:0 14px 35px rgba(0,0,0,.35),0 0 0 0 rgba(37,211,102,.24)}50%{box-shadow:0 18px 42px rgba(0,0,0,.42),0 0 0 10px rgba(37,211,102,0)}}
    @keyframes ativaGlow{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}

    .top{animation:ativaHeaderIn .65s cubic-bezier(.2,.8,.2,1) both}
    .hero .eyebrow,.hero h1,.hero p,.hero .actions,.hero .proofs,.hero .showcase{animation:ativaHeroIn .8s cubic-bezier(.2,.8,.2,1) both}
    .hero h1{animation-delay:.08s}.hero p{animation-delay:.16s}.hero .actions{animation-delay:.24s}.hero .proofs{animation-delay:.32s}.hero .showcase{animation-delay:.2s}
    .showcase:before{animation:ativaGlow 5s ease-in-out infinite}
    .screen{transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease}
    .showcase:hover .screen{transform:translateY(-5px);box-shadow:0 24px 60px rgba(0,0,0,.32)}
    .screen-cards div{transition:transform .28s ease,border-color .28s ease,background .28s ease}
    .screen-cards div:hover{transform:translateY(-4px);border-color:rgba(255,115,0,.42);background:#181818}

    .ativa-reveal{opacity:0;transform:translateY(34px);transition:opacity .75s cubic-bezier(.2,.8,.2,1),transform .75s cubic-bezier(.2,.8,.2,1)}
    .ativa-reveal.ativa-visible{opacity:1;transform:none}
    .ativa-reveal-left{opacity:0;transform:translateX(-34px);transition:opacity .75s cubic-bezier(.2,.8,.2,1),transform .75s cubic-bezier(.2,.8,.2,1)}
    .ativa-reveal-left.ativa-visible{opacity:1;transform:none}
    .ativa-reveal-right{opacity:0;transform:translateX(34px);transition:opacity .75s cubic-bezier(.2,.8,.2,1),transform .75s cubic-bezier(.2,.8,.2,1)}
    .ativa-reveal-right.ativa-visible{opacity:1;transform:none}

    .card,.benefit-item,.step,.portfolio-link,.article,.contact-box>a,.contact-box>div{will-change:transform;transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s ease,box-shadow .3s ease}
    .card:hover,.benefit-item:hover,.step:hover,.portfolio-link:hover,.article:hover{transform:translateY(-6px);box-shadow:0 18px 45px rgba(0,0,0,.24)}
    .benefit-item:hover,.step:hover{border-color:rgba(255,115,0,.32)}
    .portfolio-visual img{transition:transform .7s cubic-bezier(.2,.8,.2,1),filter .45s ease}
    .portfolio-link:hover .portfolio-visual img{transform:scale(1.045);filter:saturate(1.06) contrast(1.03)}
    .number,.check{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
    .card:hover .number,.benefit-item:hover .check{transform:rotate(-7deg) scale(1.08)}
    .btn{position:relative;overflow:hidden}
    .btn:after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transform:skewX(-22deg);transition:left .65s ease;pointer-events:none}
    .btn:hover:after{left:145%}
    .float{animation:ativaPulse 2.8s ease-in-out infinite;transition:transform .25s ease}
    .float:hover{transform:translateY(-5px) scale(1.06);animation-play-state:paused}
    .footer-brand-link img{animation:ativaFloat 4.5s ease-in-out infinite}

    @media(max-width:950px){
      .ativa-reveal-left,.ativa-reveal-right{transform:translateY(28px)}
      .ativa-reveal-left.ativa-visible,.ativa-reveal-right.ativa-visible{transform:none}
      .showcase:hover .screen{transform:none}
    }
    @media(prefers-reduced-motion:reduce){
      *,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}
      .ativa-reveal,.ativa-reveal-left,.ativa-reveal-right{opacity:1!important;transform:none!important}
    }
  `;
  document.head.appendChild(animationStyle);

  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors=[
    '.section .head',
    '.section .benefit-copy',
    '.section .benefit-list',
    '.section .services > *',
    '.section .method > *',
    '.portfolio-showcase > *',
    '.section .cta > *',
    '.footer-main > *',
    '.footer-bottom-new'
  ];

  let revealObserver=null;
  if(!reducedMotion && 'IntersectionObserver' in window){
    revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('ativa-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -40px'});
  }

  const registerAnimations=(root=document)=>{
    const elements=[];
    revealSelectors.forEach(selector=>root.querySelectorAll?.(selector).forEach(element=>elements.push(element)));
    elements.forEach((element,index)=>{
      if(element.dataset.ativaAnimated==='true')return;
      element.dataset.ativaAnimated='true';
      const isSplit=element.matches('.benefit-copy,.cta>div:first-child');
      const className=isSplit?'ativa-reveal-left':'ativa-reveal';
      element.classList.add(className);
      element.style.transitionDelay=`${Math.min(index%6,5)*55}ms`;
      if(reducedMotion || !revealObserver){
        element.classList.add('ativa-visible');
      }else{
        revealObserver.observe(element);
      }
    });
  };

  registerAnimations(document);

  const contentObserver=new MutationObserver(mutations=>{
    mutations.forEach(mutation=>{
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType===1)registerAnimations(node);
      });
    });
  });
  contentObserver.observe(document.body,{childList:true,subtree:true});

  if(!reducedMotion && window.matchMedia('(pointer:fine)').matches){
    const showcase=document.querySelector('.showcase');
    const screen=document.querySelector('.screen');
    showcase?.addEventListener('pointermove',event=>{
      const rect=showcase.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      if(screen)screen.style.transform=`perspective(900px) rotateY(${x*4}deg) rotateX(${-y*4}deg) translateY(-3px)`;
    });
    showcase?.addEventListener('pointerleave',()=>{if(screen)screen.style.transform=''});
  }
});