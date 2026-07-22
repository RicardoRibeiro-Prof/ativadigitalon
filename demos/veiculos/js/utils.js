export const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
export const numberBR = value => Number(value || 0).toLocaleString('pt-BR');
export const digits = value => String(value || '').replace(/\D/g,'');
export const normalizeBrand = value => {
  const brand=String(value||'').trim();
  if(/^volks$/i.test(brand)||/^vw$/i.test(brand)) return 'Volkswagen';
  return brand.replace(/\b\w/g,l=>l.toUpperCase());
};
export const toast=(message,type='ok')=>{
  let box=document.querySelector('#appToast');
  if(!box){box=document.createElement('div');box.id='appToast';box.style.cssText='position:fixed;right:22px;top:22px;z-index:9999;padding:14px 18px;border-radius:11px;color:#fff;font-weight:800;box-shadow:0 12px 35px rgba(0,0,0,.25)';document.body.appendChild(box)}
  box.style.background=type==='error'?'#b3261e':'#178651';box.textContent=message;box.hidden=false;clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>box.hidden=true,3200);
};
export const fallbackImage='https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=85';
