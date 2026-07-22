let VEHICLES=JSON.parse(localStorage.getItem('altura-vehicles-v2')||'null')||DEFAULT_VEHICLES;
let favorites=JSON.parse(localStorage.getItem('altura-favs')||'[]'), compare=[], currentGallery=[], galleryIndex=0, zoomed=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], money=v=>(+v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
function init(){
 const brands=[...new Set(VEHICLES.map(v=>v.marca))],cats=[...new Set(VEHICLES.map(v=>v.categoria))];
 $('#fBrand').innerHTML='<option value="">Todas</option>'+brands.map(b=>`<option>${b}</option>`).join('');
 $('#fCategory').innerHTML='<option value="">Todas</option>'+cats.map(c=>`<option>${c}</option>`).join('');
 $('#brandRow').innerHTML=brands.map(b=>`<button class="brand-chip" onclick="filterBrand('${b}')">${b}</button>`).join('');
 setTimeout(render,500);
 const obs=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.12});$$('.reveal').forEach(el=>obs.observe(el));
}
function filtered(){return VEHICLES.filter(v=>(!$('#fBrand').value||v.marca===$('#fBrand').value)&&(!$('#fCategory').value||v.categoria===$('#fCategory').value)&&(!$('#fCambio').value||v.cambio===$('#fCambio').value)&&(!$('#fPrice').value||v.preco<=+$('#fPrice').value)&&(!$('#fKm').value||v.km<=+$('#fKm').value))}
function render(list=filtered()){
 $('#resultCount').textContent=`${list.length} veículos encontrados`;
 $('#vehicleGrid').innerHTML=list.map(v=>`<article class="card"><img src="${v.fotos[0]}" alt="${v.marca} ${v.modelo}"><span class="status">${v.status}</span><button class="fav ${favorites.includes(v.id)?'active':''}" onclick="toggleFav(${v.id},event)">♡</button><div class="card-overlay"><div class="brand-label">${v.marca}</div><h3>${v.modelo}</h3><div class="version">${v.versao}</div><div class="card-bottom"><div><div class="price">${money(v.preco)}</div><div class="meta">${v.ano} • ${(+v.km).toLocaleString('pt-BR')} km • ${v.cambio||'Automático'}</div></div><div class="card-actions"><button class="details" onclick="openVehicle(${v.id})">Detalhes</button><button class="compare" onclick="toggleCompare(${v.id},event)">⇄</button></div></div></div></article>`).join('')||'<p>Nenhum veículo encontrado.</p>';
}
['fBrand','fCategory','fCambio','fPrice','fKm'].forEach(id=>document.addEventListener('input',e=>e.target.id===id&&render()));
function clearFilters(){
 ['fBrand','fCategory','fCambio','fPrice','fKm'].forEach(id=>$('#'+id).value='');
 $('#aiSearch').value='';
 $('#clearSearchBtn').classList.remove('show');
 render();
 $('#resultCount').textContent=`${VEHICLES.length} veículos encontrados`;
 setTimeout(()=>{
   document.querySelector('#estoque').scrollIntoView({behavior:'smooth',block:'start'});
 },100);
}
function filterBrand(b){$('#fBrand').value=b;render();location.hash='estoque'}
function normalizeText(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function smartSearch(){
 const raw=$('#aiSearch').value.trim();
 const q=normalizeText(raw);
 $('#clearSearchBtn').classList.toggle('show',raw.length>0);
 if(!q){render();document.querySelector('#estoque').scrollIntoView({behavior:'smooth',block:'start'});return}
 let list=[...VEHICLES];
 ['suv','sedan','picape','hatch'].forEach(c=>{if(q.includes(c)) list=list.filter(v=>normalizeText(v.categoria)===c)});
 if(q.includes('premium')) list=list.filter(v=>(v.selos||[]).some(s=>normalizeText(s).includes('premium'))||v.preco>180000);
 if(q.includes('baixa quilometragem')||q.includes('pouco rodado')||q.includes('baixa km')) list=list.filter(v=>v.km<=25000);
 const maxPrice=q.match(/(?:ate|menos de|maximo|max)\s*(?:r\$?\s*)?(\d{2,3})(?:\s*mil)?/);
 if(maxPrice) list=list.filter(v=>v.preco<=+maxPrice[1]*1000);
 const ignored=['quero','procuro','buscar','busco','um','uma','carro','veiculo','veiculos','seminovo','seminovos','automatico','automatica','manual','ate','menos','de','maximo','max','mil','com','baixa','quilometragem','pouco','rodado','premium','suv','sedan','picape','hatch'];
 const terms=q.split(/\s+/).filter(t=>t.length>1&&!ignored.includes(t)&&!/^\d+$/.test(t));
 if(terms.length) list=list.filter(v=>{const searchable=normalizeText([v.marca,v.modelo,v.versao,v.categoria,v.cambio,v.combustivel,v.cor,...(v.selos||[]),...(v.opcionais||[])].join(' '));return terms.every(term=>searchable.includes(term))});
 render(list);
 setTimeout(()=>document.querySelector('#estoque').scrollIntoView({behavior:'smooth',block:'start'}),100);
 if(list.length===1){setTimeout(()=>{const card=document.querySelector('#vehicleGrid .card');if(card){card.style.outline='3px solid var(--gold)';card.style.outlineOffset='5px';card.animate([{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:700,easing:'ease-out'})}},800)}
 if(list.length===0) $('#resultCount').textContent=`Nenhum veículo encontrado para "${raw}"`;
}
$('#aiSearch').addEventListener('input',e=>$('#clearSearchBtn').classList.toggle('show',e.target.value.trim().length>0));
$('#aiSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();smartSearch()}});
function toggleFav(id,e){if(e)e.stopPropagation();favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem('altura-favs',JSON.stringify(favorites));render()}
function showFavorites(){render(VEHICLES.filter(v=>favorites.includes(v.id)));location.hash='estoque'}
function openVehicle(id){
 const v=VEHICLES.find(x=>x.id===id);if(!v)return;currentGallery=v.fotos;galleryIndex=0;
 const similar=VEHICLES.filter(x=>x.id!==id&&(x.categoria===v.categoria||x.marca===v.marca)).slice(0,3);
 $('#vehicleContent').innerHTML=`<div class="breadcrumb">Início / Estoque / ${v.marca} / ${v.modelo}</div><div class="vehicle-page"><section class="gallery"><div class="main-photo"><img id="mainPhoto" src="${v.fotos[0]}" onclick="openLightbox(0)"><span class="photo-count">${v.fotos.length} fotos</span></div><div class="thumbs">${v.fotos.map((p,i)=>`<button class="${i===0?'active':''}" onclick="changePhoto(${i},this)"><img src="${p}"></button>`).join('')}</div></section><aside class="vehicle-info"><div class="brand-label">${v.marca}</div><h2>${v.modelo}</h2><div class="version">${v.versao}</div><div class="badges">${(v.selos||[]).map(s=>`<span class="badge">${s}</span>`).join('')}</div><div class="price">${money(v.preco)}</div><p style="color:#666;line-height:1.7">${v.descricao||''}</p><div class="specs">${[['Ano',v.ano],['KM',(+v.km).toLocaleString('pt-BR')+' km'],['Motor',v.motor||'-'],['Potência',v.potencia||'-'],['Câmbio',v.cambio||'Automático'],['Combustível',v.combustivel||'-'],['Cor',v.cor||'-'],['Tração',v.tracao||'-']].map(x=>`<div class="spec"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('')}</div><h3>Opcionais</h3><div class="options">${(v.opcionais||[]).map(o=>`<span>✓ ${o}</span>`).join('')}</div><div class="vehicle-actions"><a class="wa" target="_blank" href="https://wa.me/5589981311034?text=${encodeURIComponent('Olá! Tenho interesse no '+v.marca+' '+v.modelo)}">Falar no WhatsApp</a><button class="secondary" onclick="shareVehicle('${v.slug}')">Compartilhar</button><button class="secondary" onclick="toggleFav(${v.id},event)">♡</button></div></aside></div><section class="video-block"><div class="section-head"><div><div class="eyebrow">Apresentação</div><h2>Conheça o veículo</h2></div></div><iframe src="${v.video||''}" title="Vídeo demonstrativo" allowfullscreen></iframe></section><section class="similar"><h2 style="font:800 32px Manrope">Veículos semelhantes</h2><div class="similar-grid">${similar.map(x=>`<a class="similar-card" onclick="openVehicle(${x.id})"><img src="${x.fotos[0]}"><div><b>${x.marca} ${x.modelo}</b><br>${money(x.preco)}</div></a>`).join('')}</div></section>`;
 $('#vehicleModal').classList.add('open');document.body.classList.add('lock');history.pushState({},'',`#veiculo/${v.slug}`);
}
function changePhoto(i,btn){galleryIndex=i;$('#mainPhoto').src=currentGallery[i];$$('.thumbs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}
function closeModal(){$('#vehicleModal').classList.remove('open');document.body.classList.remove('lock');history.pushState({},'','#estoque')}
function openLightbox(i){galleryIndex=i;zoomed=false;updateLightbox();$('#lightbox').classList.add('open');document.body.classList.add('lock')}
function updateLightbox(){$('#lightboxImg').src=currentGallery[galleryIndex];$('#lightboxImg').style.transform='scale(1)';$('#lbCount').textContent=`${galleryIndex+1} / ${currentGallery.length}`}
function stepLightbox(d){galleryIndex=(galleryIndex+d+currentGallery.length)%currentGallery.length;zoomed=false;updateLightbox()}
function zoomLightbox(){zoomed=!zoomed;$('#lightboxImg').style.transform=zoomed?'scale(1.6)':'scale(1)'}
function closeLightbox(){$('#lightbox').classList.remove('open');document.body.classList.remove('lock')}
document.addEventListener('keydown',e=>{if($('#lightbox').classList.contains('open')){if(e.key==='ArrowRight')stepLightbox(1);if(e.key==='ArrowLeft')stepLightbox(-1);if(e.key==='Escape')closeLightbox()}})
async function shareVehicle(slug){const url=location.href.split('#')[0]+'#veiculo/'+slug;if(navigator.share)await navigator.share({title:'Altura Motors',url});else{await navigator.clipboard.writeText(url);alert('Link copiado!')}}
function toggleCompare(id,e){e.stopPropagation();compare=compare.includes(id)?compare.filter(x=>x!==id):[...compare,id].slice(-2);$('#compareBar').classList.toggle('show',compare.length>0);$('#compareText').textContent=compare.length+' selecionado(s)'}
function openCompare(){if(compare.length<2)return alert('Selecione dois veículos.');const a=VEHICLES.find(v=>v.id===compare[0]),b=VEHICLES.find(v=>v.id===compare[1]);alert(`${a.marca} ${a.modelo} x ${b.marca} ${b.modelo}\n\nPreço: ${money(a.preco)} x ${money(b.preco)}\nKM: ${a.km} x ${b.km}\nAno: ${a.ano} x ${b.ano}`)}
function persist(){localStorage.setItem('altura-vehicles-v2',JSON.stringify(VEHICLES))}
init();