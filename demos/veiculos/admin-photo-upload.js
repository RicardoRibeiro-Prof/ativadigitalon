let vehiclePhotoData=[];
const MAX_VEHICLE_PHOTOS=10;
const MAX_FILE_SIZE=5*1024*1024;
const ACCEPTED_TYPES=['image/jpeg','image/png','image/webp'];

function renderVehiclePhotoPreviews(){
 const box=document.querySelector('#vehiclePhotoPreviews');
 const counter=document.querySelector('#vehiclePhotoCounter');
 const error=document.querySelector('#vehiclePhotoError');
 if(!box||!counter)return;
 counter.textContent=`${vehiclePhotoData.length} de ${MAX_VEHICLE_PHOTOS} fotos selecionadas`;
 box.innerHTML=vehiclePhotoData.map((src,index)=>`<div class="photo-preview"><img src="${src}" alt="Foto ${index+1}"><button type="button" class="photo-remove" onclick="removeVehiclePhoto(${index})" aria-label="Remover foto">×</button>${index===0?'<span class="photo-cover">CAPA</span>':''}</div>`).join('');
 if(error)error.textContent='';
}

function removeVehiclePhoto(index){
 vehiclePhotoData.splice(index,1);
 renderVehiclePhotoPreviews();
}

function compressVehiclePhoto(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(new Error('Imagem inválida.'));
   img.onload=()=>{
    const maxSide=1600;
    let {width,height}=img;
    const scale=Math.min(1,maxSide/Math.max(width,height));
    width=Math.round(width*scale);height=Math.round(height*scale);
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0,width,height);
    resolve(canvas.toDataURL('image/webp',0.76));
   };
   img.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}

async function handleVehiclePhotos(event){
 const files=[...event.target.files];
 const error=document.querySelector('#vehiclePhotoError');
 if(!files.length)return;
 if(vehiclePhotoData.length+files.length>MAX_VEHICLE_PHOTOS){
  error.textContent=`Selecione no máximo ${MAX_VEHICLE_PHOTOS} fotos por veículo.`;
  event.target.value='';return;
 }
 for(const file of files){
  if(!ACCEPTED_TYPES.includes(file.type)){
   error.textContent='Formato não aceito. Use JPG, JPEG, PNG ou WEBP.';
   event.target.value='';return;
  }
  if(file.size>MAX_FILE_SIZE){
   error.textContent='Cada foto deve ter no máximo 5 MB.';
   event.target.value='';return;
  }
 }
 try{
  const compressed=await Promise.all(files.map(compressVehiclePhoto));
  vehiclePhotoData.push(...compressed);
  renderVehiclePhotoPreviews();
 }catch(err){
  error.textContent=err.message||'Erro ao processar as imagens.';
 }
 event.target.value='';
}

window.openVehicle=function(id=''){
 const vehicle=VEHICLES.find(v=>String(v.id)===String(id));
 const set=(selector,value)=>{const el=document.querySelector(selector);if(el)el.value=value??''};
 set('#vehicleId',vehicle?.id||'');
 const title=document.querySelector('#vehicleModalTitle');
 if(title)title.textContent=vehicle?'Editar veículo':'Novo veículo';
 set('#vmMarca',vehicle?.marca||'');
 set('#vmModelo',vehicle?.modelo||'');
 set('#vmVersao',vehicle?.versao||'');
 set('#vmAno',vehicle?.ano||'');
 set('#vmKm',vehicle?.km||'');
 set('#vmPreco',vehicle?.preco||'');
 set('#vmCategoria',vehicle?.categoria||'SUV');
 set('#vmStatus',vehicle?.status||'Disponível');
 set('#vmDescricao',vehicle?.descricao||'');
 const input=document.querySelector('#vmPhotos');
 if(input)input.value='';
 vehiclePhotoData=[...(vehicle?.fotos||[])].slice(0,MAX_VEHICLE_PHOTOS);
 renderVehiclePhotoPreviews();
 const modal=document.querySelector('#vehicleModal');
 if(modal)modal.classList.add('open');
};

window.saveVehicle=function(e){
 e.preventDefault();
 const id=document.querySelector('#vehicleId')?.value||'';
 const old=VEHICLES.find(v=>String(v.id)===String(id));
 const error=document.querySelector('#vehiclePhotoError');
 if(!vehiclePhotoData.length){
  if(error)error.textContent='Adicione pelo menos uma foto do veículo.';
  return;
 }
 const val=id=>document.querySelector(id)?.value||'';
 const obj={...old,id:id?+id:Date.now(),marca:val('#vmMarca'),modelo:val('#vmModelo'),versao:val('#vmVersao'),ano:val('#vmAno'),km:+val('#vmKm'),preco:+val('#vmPreco'),categoria:val('#vmCategoria'),status:val('#vmStatus'),fotos:vehiclePhotoData.slice(0,MAX_VEHICLE_PHOTOS),descricao:val('#vmDescricao'),cambio:old?.cambio||'Automático',selos:old?.selos||[],opcionais:old?.opcionais||[]};
 try{
  const next=id?VEHICLES.map(v=>String(v.id)===String(id)?obj:v):[obj,...VEHICLES];
  localStorage.setItem('altura-vehicles-v2',JSON.stringify(next));
  VEHICLES=next;
  persist();
  closeModal('vehicleModal');
  render();
 }catch(err){
  if(error)error.textContent='As fotos ultrapassaram o limite do navegador. Reduza a quantidade ou o tamanho das imagens.';
 }
};
