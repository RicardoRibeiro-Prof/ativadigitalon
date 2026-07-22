(function(){
 const $=s=>document.querySelector(s);
 const digits=v=>String(v??'').replace(/\D/g,'');
 const parseNumber=v=>Number(digits(v))||0;
 const formatNumber=v=>parseNumber(v).toLocaleString('pt-BR');
 const formatMoney=v=>'R$ '+formatNumber(v);

 function applyMasks(){
  const km=$('#vmKm'),price=$('#vmPreco');
  if(km){
   km.type='text';km.inputMode='numeric';km.placeholder='Ex.: 60.000 km';
   km.oninput=()=>{const n=parseNumber(km.value);km.value=n?formatNumber(n):''};
  }
  if(price){
   price.type='text';price.inputMode='numeric';price.placeholder='Ex.: R$ 45.000';
   price.oninput=()=>{const n=parseNumber(price.value);price.value=n?formatMoney(n):''};
  }
 }

 const previousOpen=window.openVehicle;
 window.openVehicle=function(id=''){
  previousOpen(id);
  applyMasks();
  const v=VEHICLES.find(x=>String(x.id)===String(id));
  const km=$('#vmKm'),price=$('#vmPreco');
  if(km)km.value=v?formatNumber(v.km):'';
  if(price)price.value=v?formatMoney(v.preco):'';
 };

 window.saveVehicle=function(e){
  e.preventDefault();
  const id=$('#vehicleId').value;
  const old=VEHICLES.find(v=>String(v.id)===String(id));
  const error=$('#vehiclePhotoError');
  if(!vehiclePhotoData.length){if(error)error.textContent='Adicione pelo menos uma foto do veículo.';return}
  const obj={
   ...old,
   id:id?(old?.id??id):Date.now(),
   marca:$('#vmMarca').value.trim(),
   modelo:$('#vmModelo').value.trim(),
   versao:$('#vmVersao').value.trim(),
   ano:$('#vmAno').value.trim(),
   km:parseNumber($('#vmKm').value),
   preco:parseNumber($('#vmPreco').value),
   categoria:$('#vmCategoria').value,
   status:$('#vmStatus').value,
   fotos:vehiclePhotoData.slice(0,10),
   descricao:$('#vmDescricao').value.trim(),
   cambio:old?.cambio||'Automático',
   selos:old?.selos||[],
   opcionais:old?.opcionais||[]
  };
  if(!obj.marca||!obj.modelo||!obj.versao||!obj.ano||!obj.km||!obj.preco){
   if(error)error.textContent='Preencha corretamente todos os campos obrigatórios.';return;
  }
  try{
   if(id){
    const index=VEHICLES.findIndex(v=>String(v.id)===String(id));
    if(index<0)throw new Error('Veículo não encontrado para edição.');
    VEHICLES[index]=obj;
   }else{
    VEHICLES.unshift(obj);
   }
   persist();
   closeModal('vehicleModal');
   render();
   setTimeout(()=>alert(id?'Veículo atualizado com sucesso!':'Veículo cadastrado com sucesso!'),50);
  }catch(err){
   if(error)error.textContent=err.message||'Não foi possível salvar o veículo.';
  }
 };

 document.addEventListener('DOMContentLoaded',applyMasks);
})();