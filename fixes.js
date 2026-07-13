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
});