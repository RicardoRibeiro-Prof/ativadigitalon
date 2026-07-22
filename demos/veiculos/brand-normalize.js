(function(){
  function normalizeBrandName(value){
    const raw=String(value||'').trim();
    const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(['volks','vw','volkswagem','volkswagen'].includes(key)) return 'Volkswagen';
    return raw;
  }

  function applyBrandNormalization(){
    if(!Array.isArray(window.VEHICLES)) return false;
    let changed=false;
    window.VEHICLES=window.VEHICLES.map(vehicle=>{
      const marca=normalizeBrandName(vehicle.marca);
      if(marca!==vehicle.marca) changed=true;
      return {...vehicle,marca};
    });
    if(changed){
      localStorage.setItem('altura-vehicles-v2',JSON.stringify(window.VEHICLES));
    }
    if(typeof window.render==='function') window.render();
    return changed;
  }

  window.normalizeBrandName=normalizeBrandName;
  window.addEventListener('DOMContentLoaded',()=>setTimeout(applyBrandNormalization,0));
  setTimeout(applyBrandNormalization,50);
})();