import { supabase } from './supabase-config.js';
import { money,numberBR,normalizeBrand,fallbackImage } from './utils.js';

let vehicles=[];
let filtered=[];
const $=s=>document.querySelector(s);

async function loadVehicles(){
  $('#vehicleGrid').innerHTML='<div class="skeleton"></div><div class="skeleton"></div>';
  const {data,error}=await supabase.from('vehicles').select('*,vehicle_photos(*)').order('created_at',{ascending:false});
  if(error){$('#vehicleGrid').innerHTML='<p>Não foi possível carregar o estoque.</p>';console.error(error);return;}
  vehicles=(data||[]).map(v=>({...v,brand:normalizeBrand(v.brand),photos:(v.vehicle_photos||[]).sort((a,b)=>a.position-b.position)}));
  filtered=[...vehicles];
  buildFilters();render();
}

function buildFilters(){
  const brand=$('#fBrand'),category=$('#fCategory');
  if(brand){brand.innerHTML='<option value="">Todas</option>'+[...new Set(vehicles.map(v=>v.brand))].sort().map(x=>`<option>${x}</option>`).join('');brand.onchange=applyFilters;}
  if(category){category.innerHTML='<option value="">Todas</option>'+[...new Set(vehicles.map(v=>v.category))].sort().map(x=>`<option>${x}</option>`).join('');category.onchange=applyFilters;}
  ['#fCambio','#fPrice','#fKm'].forEach(id=>{const el=$(id);if(el)el.oninput=applyFilters;});
}

function applyFilters(){
  const brand=$('#fBrand')?.value||'',cat=$('#fCategory')?.value||'',trans=$('#fCambio')?.value||'',price=Number($('#fPrice')?.value||0),km=Number($('#fKm')?.value||0);
  filtered=vehicles.filter(v=>(!brand||v.brand===brand)&&(!cat||v.category===cat)&&(!trans||v.transmission===trans)&&(!price||Number(v.price)<=price)&&(!km||Number(v.mileage)<=km));
  render();
}

window.clearFilters=()=>{['#fBrand','#fCategory','#fCambio','#fPrice','#fKm','#aiSearch'].forEach(id=>{const el=$(id);if(el)el.value=''});filtered=[...vehicles];render();};
window.smartSearch=()=>{const q=($('#aiSearch')?.value||'').toLowerCase().trim();filtered=!q?[...vehicles]:vehicles.filter(v=>`${v.brand} ${v.model} ${v.version} ${v.category} ${v.transmission}`.toLowerCase().includes(q));render();document.querySelector('#estoque')?.scrollIntoView({behavior:'smooth'});};
window.showFavorites=()=>alert('Favoritos serão integrados na próxima etapa.');

function render(){
  $('#resultCount').textContent=`${filtered.length} veículo${filtered.length===1?'':'s'} encontrado${filtered.length===1?'':'s'}`;
  $('#vehicleGrid').innerHTML=filtered.map(v=>{
    const cover=v.photos.find(p=>p.is_cover)||v.photos[0];
    const sold=v.status==='Vendido';
    return `<article class="card ${sold?'sold':''}"><img src="${cover?.public_url||fallbackImage}" alt="${v.brand} ${v.model}" onerror="this.src='${fallbackImage}'">${sold?'<div class="sold-ribbon">VENDIDO</div>':''}<span class="status">${v.status}</span><div class="card-overlay"><div class="brand-label">${v.brand}</div><h3>${v.model}</h3><div class="version">${v.version}</div><div class="card-bottom"><div><div class="price">${money(v.price)}</div><div class="meta">${v.year_model} • ${numberBR(v.mileage)} km • ${v.transmission}</div></div><div class="card-actions"><button class="details" onclick="openVehicle('${v.id}')">Detalhes</button></div></div></div></article>`;
  }).join('')||'<p>Nenhum veículo encontrado.</p>';
}

window.openVehicle=id=>{
 const v=vehicles.find(x=>x.id===id);if(!v)return;
 const photos=v.photos.length?v.photos:[{public_url:fallbackImage}];
 $('#vehicleContent').innerHTML=`<div class="vehicle-page"><div class="gallery"><div class="main-photo"><img id="mainVehiclePhoto" src="${photos[0].public_url}"></div><div class="thumbs">${photos.map((p,i)=>`<button onclick="document.querySelector('#mainVehiclePhoto').src='${p.public_url}'"><img src="${p.public_url}"></button>`).join('')}</div></div><div class="vehicle-info"><div class="eyebrow">${v.brand}</div><h2>${v.model}</h2><div class="version">${v.version}</div><div class="price">${money(v.price)}</div><div class="specs"><div class="spec"><small>Ano</small>${v.year_model}</div><div class="spec"><small>KM</small>${numberBR(v.mileage)}</div><div class="spec"><small>Câmbio</small>${v.transmission}</div><div class="spec"><small>Status</small>${v.status}</div></div><p>${v.description||''}</p><a class="wa" target="_blank" href="https://wa.me/5589981311034?text=${encodeURIComponent('Olá! Tenho interesse no '+v.brand+' '+v.model)}">Falar no WhatsApp</a></div></div>`;
 $('#vehicleModal').classList.add('open');document.body.classList.add('lock');
};
window.closeModal=()=>{$('#vehicleModal').classList.remove('open');document.body.classList.remove('lock');};

document.addEventListener('DOMContentLoaded',loadVehicles);
