/* Espace de gestion : impact annuel + événement mis en avant. */
(function () {
  'use strict';
  var CM = window.CM, B = window.Backend, esc = CM.esc;
  var root = document.getElementById('gestion-root');
  var state = { tab: 'impact', year: new Date().getFullYear(), reports: [], edit: null, event: null, photo: '' };
  function role() { var u = B.user(); return u ? u.role : ''; }
  function canImpact() { return role() === 'admin' || role() === 'president'; }
  function canEvent() { return ['admin','president','photographe'].indexOf(role()) >= 0; }
  function today() { var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function fmtDate(s) { return s ? CM.fmtDate(s) : ''; }
  function n(v) { return Number(v || 0).toLocaleString('fr-FR', {maximumFractionDigits:1}); }

  async function load() {
    if (!canEvent()) { renderDenied(); return; }
    if (canImpact()) {
      state.reports = await B.listImpactReports(state.year);
    }
    state.event = await B.getFeaturedEvent();
    render();
  }
  function renderDenied() {
    var u = B.user();
    root.innerHTML = '<div class="gestion-shell"><section class="gestion-panel"><h2>Accès réservé</h2><p>' +
      (u ? 'Ce compte ne dispose pas des droits nécessaires pour accéder à cet espace.' :
        'Connecte-toi avec un compte Président, Administrateur ou Photographe pour accéder à cet espace.') +
      (u ? '' : '<button class="btn" type="button" data-login>Se connecter</button>') +
      '</section></div>';
  }
  function tabsHtml() {
    var a = canImpact() ? '<button class="btn btn-ghost" type="button" data-tab="impact" aria-selected="'+(state.tab==='impact')+'">Bilan de l’impact</button>' : '';
    var b = canEvent() ? '<button class="btn btn-ghost" type="button" data-tab="event" aria-selected="'+(state.tab==='event')+'">Événement à venir</button>' : '';
    return '<div class="gestion-tabs" role="tablist">'+a+b+'</div>';
  }
  function impactHtml() {
    var r=state.reports, totals=r.reduce(function(t,x){
      t.maraudes+=Number(x.maraudes_count==null?1:x.maraudes_count); t.kg+=Number(x.kibble_kg||0); t.leashes+=Number(x.leashes||0); t.harnesses+=Number(x.harnesses||0); t.toys+=Number(x.toys||0); return t;
    },{maraudes:0,kg:0,leashes:0,harnesses:0,toys:0});
    var edit=state.edit||{};
    var history=r.length ? r.map(function(x){
      return '<article class="gestion-report"><div><strong>'+esc(fmtDate(x.date))+'</strong><p>'+n(x.maraudes_count==null?1:x.maraudes_count)+' maraude(s) · '+n(x.kibble_kg)+' kg de croquettes · '+n(x.leashes)+' laisses · '+n(x.harnesses)+' harnais · '+n(x.toys)+' jouets'+'</p></div><button class="btn btn-ghost btn-sm" type="button" data-edit="'+esc(x.id)+'">Corriger</button></article>';
    }).join('') : '<div class="gestion-empty">Aucun bilan enregistré pour '+state.year+'. Ajoute le premier bilan ci-dessous.</div>';
    return '<section class="gestion-panel"><h2>Bilan de l’impact</h2><p class="gestion-help">Les totaux additionnent les bilans enregistrés pour l’année choisie. Chaque maraude doit avoir sa propre ligne.</p>'+
      '<div class="gestion-grid"><label>Année affichée<select id="impact-year">'+Array.from({length:8},function(_,i){return new Date().getFullYear()+1-i;}).map(function(y){return '<option value="'+y+'" '+(y===Number(state.year)?'selected':'')+'>'+y+'</option>';}).join('')+'</select></label>'+
      '<div><strong>Totaux enregistrés en '+state.year+'</strong><p class="gestion-help">'+n(totals.maraudes)+' maraudes · '+n(totals.kg)+' kg · '+n(totals.leashes)+' laisses · '+n(totals.harnesses)+' harnais · '+n(totals.toys)+' jouets</p></div></div></section>'+
      '<section class="gestion-panel"><h2>'+(edit.id?'Corriger un bilan':'Ajouter le bilan d’une maraude')+'</h2>'+
      '<form class="gestion-form" id="impact-form"><input type="hidden" name="id" value="'+esc(edit.id||'')+'">'+
      '<div class="gestion-grid"><label>Date de la maraude / période<input type="date" name="date" required value="'+esc(edit.date||today())+'"></label><label>Nombre de maraudes couvertes<input type="number" name="maraudes_count" min="0" step="1" value="'+esc(edit.maraudes_count==null?'1':edit.maraudes_count)+'" required></label>'+
      '<label>Croquettes distribuées (kg)<input type="number" name="kibble_kg" min="0" step="0.1" value="'+esc(edit.kibble_kg==null?'0':edit.kibble_kg)+'" required></label>'+
      '<label>Laisses distribuées<input type="number" name="leashes" min="0" step="1" value="'+esc(edit.leashes==null?'0':edit.leashes)+'" required></label>'+
      '<label>Harnais distribués<input type="number" name="harnesses" min="0" step="1" value="'+esc(edit.harnesses==null?'0':edit.harnesses)+'" required></label>'+
      '<label>Jouets distribués<input type="number" name="toys" min="0" step="1" value="'+esc(edit.toys==null?'0':edit.toys)+'" required></label></div>'+
      '<div class="gestion-actions"><button class="btn" type="submit">'+(edit.id?'Enregistrer la correction':'Ajouter ce bilan')+'</button>'+(edit.id?'<button class="btn btn-ghost" type="button" data-cancel-edit>Annuler</button>':'')+'</div><p class="gestion-status" id="impact-status" role="status"></p></form></section>'+
      '<section class="gestion-panel"><h2>Historique des maraudes — '+state.year+'</h2><div class="gestion-list">'+history+'</div></section>';
  }
  function eventHtml() {
    var e=state.event||{}, photo=e.photo_url||state.photo;
    return '<section class="gestion-panel"><h2>Événement mis en avant</h2><p class="gestion-help">Un seul événement est publié dans « Où nous retrouver ». En enregistrant un nouvel événement, il remplace le précédent.</p>'+
      (photo?'<div class="gestion-event-preview"><img src="'+esc(photo)+'" alt="Aperçu de l’événement"><p class="gestion-help">Photo actuellement sélectionnée</p></div>':'')+
      '<form class="gestion-form" id="event-form"><label>Nom de l’événement<input name="title" maxlength="160" required value="'+esc(e.title||'')+'"></label>'+
      '<div class="gestion-grid"><label>Date<input type="date" name="date" required value="'+esc(e.date||'')+'"></label><label>Localisation<input name="place" maxlength="180" required value="'+esc(e.place||'')+'"></label></div>'+
      '<label>Description<textarea name="description" required>'+esc(e.description||'')+'</textarea></label>'+
      '<label>Photo de l’événement<input type="file" name="photo" accept="image/*"><span class="gestion-help">Choisis une photo pour remplacer l’image actuelle. Formats image classiques ; elle sera réduite avant l’envoi.</span></label>'+
      '<div class="gestion-actions"><button class="btn" type="submit">Enregistrer l’événement</button></div><p class="gestion-status" id="event-status" role="status"></p></form></section>';
  }
  function render() {
    var u=B.user();
    if (!u || !canEvent()) return renderDenied();
    if (!canImpact() && state.tab==='impact') state.tab='event';
    root.innerHTML='<div class="gestion-shell"><div class="gestion-intro"><p>Connecté : <strong>'+esc(u.name)+'</strong> · '+esc(CM.ROLE_LABEL[u.role]||'')+'</p><p class="gestion-help">Les outils sont séparés par onglet pour garder cet espace clair et facile à utiliser.</p></div>'+
      tabsHtml()+(state.tab==='impact'&&canImpact()?impactHtml():eventHtml())+'</div>';
  }
  async function refreshImpact() { state.reports=await B.listImpactReports(state.year); render(); }
  root.addEventListener('click',async function(ev){
    var t=ev.target.closest('[data-tab],[data-edit],[data-cancel-edit]'); if(!t)return;
    if(t.dataset.tab){state.tab=t.dataset.tab;state.edit=null;render();}
    if(t.dataset.cancelEdit!==undefined){state.edit=null;render();}
    if(t.dataset.edit){state.edit=state.reports.find(function(x){return x.id===t.dataset.edit;})||null;render();window.scrollTo({top:0,behavior:'smooth'});}
  });
  root.addEventListener('change',async function(ev){
    if(ev.target.id==='impact-year'){state.year=Number(ev.target.value);state.edit=null;try{await refreshImpact();}catch(e){CM.toast(e.message);}}
  });
  root.addEventListener('submit',async function(ev){
    if(ev.target.id==='impact-form'){
      ev.preventDefault(); var f=ev.target, st=document.getElementById('impact-status'), btn=f.querySelector('[type=submit]'); btn.disabled=true;
      try {
        var vals={id:f.elements.id.value||null,date:f.elements.date.value,maraudes_count:f.elements.maraudes_count.value,kibble_kg:f.elements.kibble_kg.value,
          leashes:f.elements.leashes.value,harnesses:f.elements.harnesses.value,toys:f.elements.toys.value};
        await B.saveImpactReport(vals); state.year=Number(vals.date.slice(0,4)); state.edit=null; CM.toast('Bilan enregistré. Les totaux sont recalculés.'); await refreshImpact();
      } catch(e){st.textContent=e.message;btn.disabled=false;}
    }
    if(ev.target.id==='event-form'){
      ev.preventDefault(); var form=ev.target, status=document.getElementById('event-status'), button=form.querySelector('[type=submit]'); button.disabled=true;
      try {
        var photo=state.photo || (state.event&&state.event.photo_url) || '';
        var file=form.elements.photo.files[0];
        if(file){status.textContent='Envoi de la photo…';photo=await B.uploadSitePhoto(file);}
        status.textContent='Enregistrement…';
        await B.saveFeaturedEvent({date:form.elements.date.value,title:form.elements.title.value.trim(),place:form.elements.place.value.trim(),
          description:form.elements.description.value.trim(),photo_url:photo});
        state.photo=''; CM.toast('Événement mis à jour.'); await load();
      }catch(e){status.textContent=e.message;button.disabled=false;}
    }
  });
  window.addEventListener('cm:auth',function(){state.edit=null;load().catch(function(e){root.innerHTML='<div class="notice err">'+esc(e.message)+'</div>';});});
  CM.ready.then(function(){return load();}).catch(function(e){root.innerHTML='<div class="notice err">'+esc(e.message)+'</div>';});
})();
