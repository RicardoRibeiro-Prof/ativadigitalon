document.addEventListener('DOMContentLoaded',()=>{
  const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precisePointer=window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const heroHighlight=document.querySelector('.hero h1 > span');
  if(heroHighlight && !heroHighlight.dataset.wordAnimation){
    const text=heroHighlight.textContent.trim();
    heroHighlight.dataset.wordAnimation='true';
    heroHighlight.classList.add('hero-title-highlight');
    heroHighlight.setAttribute('aria-label',text);
    heroHighlight.innerHTML=text
      .split(/\s+/)
      .map((word,index)=>`<span class="hero-word" aria-hidden="true" style="--word-index:${index}">${word}</span>`)
      .join(' ');
  }

  document.querySelectorAll('.head h2,.benefit-copy h2,.cta h2').forEach(titleElement=>{
    titleElement.classList.add('section-title');
  });

  const revealGroups=[
    {selector:'.hero-grid > div:first-child > .eyebrow,.hero-grid > div:first-child > h1,.hero-grid > div:first-child > p,.hero-grid > div:first-child > .actions,.hero-grid > div:first-child > .proofs,.hero-grid > .showcase',step:90},
    {selector:'.head small,.head h2,.head > p',step:85},
    {selector:'.services > .card',step:75},
    {selector:'.benefit-copy > .eyebrow,.benefit-copy > h2,.benefit-copy > p',step:90},
    {selector:'.benefit-list > .benefit-item',step:80},
    {selector:'.portfolio-showcase > .portfolio-link',step:75},
    {selector:'.portfolio-note',step:0},
    {selector:'.method > .step',step:80},
    {selector:'.cta > *',step:110},
    {selector:'.footer-main > *',step:85}
  ];

  const revealElements=[];
  revealGroups.forEach(group=>{
    document.querySelectorAll(group.selector).forEach((element,index)=>{
      if(element.dataset.revealRegistered)return;
      element.dataset.revealRegistered='true';
      element.classList.add('reveal-on-scroll');
      if(element.matches('small,p,.portfolio-note,.footer-bottom-new')){
        element.classList.add('reveal-subtle');
      }
      element.style.setProperty('--reveal-delay',`${index*group.step}ms`);
      revealElements.push(element);
    });
  });

  const revealElement=element=>{
    element.classList.add('is-visible');
    element.querySelectorAll?.('.section-title').forEach(title=>title.classList.add('is-visible'));
  };

  if(prefersReducedMotion || !('IntersectionObserver' in window)){
    revealElements.forEach(revealElement);
  }else{
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        revealElement(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -42px'});

    revealElements.forEach(element=>revealObserver.observe(element));
  }

  const motionElements=document.querySelectorAll('.card,.benefit-item,.step,.portfolio-link,.showcase,.proof,.screen-cards > div,.contact-box > a,.contact-box > div');
  motionElements.forEach(element=>element.classList.add('motion-card'));

  if(!prefersReducedMotion && precisePointer){
    const tiltElements=document.querySelectorAll('.card,.benefit-item,.step,.portfolio-link,.showcase');

    tiltElements.forEach(element=>{
      let frameId=0;
      let pendingEvent=null;

      const updateTilt=()=>{
        frameId=0;
        if(!pendingEvent)return;

        const rect=element.getBoundingClientRect();
        const x=Math.max(0,Math.min(1,(pendingEvent.clientX-rect.left)/rect.width));
        const y=Math.max(0,Math.min(1,(pendingEvent.clientY-rect.top)/rect.height));
        const strength=element.classList.contains('showcase')?4:3;

        element.style.setProperty('--pointer-x',`${x*100}%`);
        element.style.setProperty('--pointer-y',`${y*100}%`);
        element.style.setProperty('--tilt-y',`${(x-.5)*strength}deg`);
        element.style.setProperty('--tilt-x',`${(.5-y)*strength}deg`);
      };

      element.addEventListener('pointerenter',()=>{
        element.classList.add('is-interacting');
      });

      element.addEventListener('pointermove',event=>{
        pendingEvent=event;
        if(!frameId)frameId=requestAnimationFrame(updateTilt);
      });

      element.addEventListener('pointerleave',()=>{
        pendingEvent=null;
        if(frameId)cancelAnimationFrame(frameId);
        frameId=0;
        element.classList.remove('is-interacting');
        element.style.setProperty('--pointer-x','50%');
        element.style.setProperty('--pointer-y','50%');
        element.style.setProperty('--tilt-x','0deg');
        element.style.setProperty('--tilt-y','0deg');
      });
    });

    document.querySelectorAll('.screen-cards > div,.proof,.contact-box > a,.contact-box > div').forEach(element=>{
      element.addEventListener('pointermove',event=>{
        const rect=element.getBoundingClientRect();
        element.style.setProperty('--pointer-x',`${((event.clientX-rect.left)/rect.width)*100}%`);
        element.style.setProperty('--pointer-y',`${((event.clientY-rect.top)/rect.height)*100}%`);
      });
      element.addEventListener('pointerleave',()=>{
        element.style.setProperty('--pointer-x','50%');
        element.style.setProperty('--pointer-y','50%');
      });
    });
  }

  const header=document.querySelector('.top');
  let scrollFrame=0;
  const updateHeader=()=>{
    scrollFrame=0;
    header?.classList.toggle('is-scrolled',window.scrollY>18);
  };

  updateHeader();
  window.addEventListener('scroll',()=>{
    if(!scrollFrame)scrollFrame=requestAnimationFrame(updateHeader);
  },{passive:true});

  const menuButton=document.querySelector('.menu');
  const nav=document.querySelector('.links');
  nav?.addEventListener('click',event=>{
    if(!event.target.closest('a'))return;
    nav.classList.remove('open');
    if(menuButton){
      menuButton.textContent='☰';
      menuButton.setAttribute('aria-expanded','false');
    }
  });
});
