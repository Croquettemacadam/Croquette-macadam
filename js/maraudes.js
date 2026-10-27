/* Page Maraudes : galerie publique + outils photographe/admin. */
(function () {
  'use strict';
  var CM = window.CM, C = CM.C, esc = CM.esc, B = window.Backend;
  var root = document.getElementById('maraudes-root');
  var toolsRoot = document.getElementById('tools-root');
  var dynamic = [];
  var editing = null; /* { id|null, photos: [urls] } */

  function canEdit() { var u = B.user(); return !!u && (u.role === 'photographe' || u.role === 'admin'); }

  function entries() {
    var st = C.maraudes.entries.map(function (e) { return { id: null, date: e.date, title: e.title, text: e.text, photos: e.photos || [] }; });
    var dy = dynamic.map(function (m) {
      return { id: m.id, date: m.date, title: m.title, text: m.text, photos: (m.photos || []).map(function (u) { return { src: u, alt: m.title || 'Maraude' }; }) };
    });
    return dy.concat(st).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function render() {
    var list = entries();
    if (!list.length) { root.innerHTML = '<p class="muted">Aucune maraude publiée pour l\'instant.</p>'; return; }
    root.innerHTML = list.map(function (m) {
      var tools = (canEdit() && m.id)
        ? '<div class="actions-row"><button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + esc(m.id) + '">Modifier / ajouter des photos</button>' +
          '<button class="btn btn-danger btn-sm" data-act="del" data-id="' + esc(m.id) + '">Supprimer</button></div>' : '';
      return '<article class="maraude"><p class="date">' + esc(CM.fmtDate(m.date)) + '</p>' +
        (m.title ? '<h2>' + esc(m.title) + '</h2>' : '') +
        (m.text ? '<p class="lead">' + esc(m.text) + '</p>' : '') +
        '<div class="gallery masonry">' + m.photos.map(function (p) { return CM.photoFigure(p, { ratio: 'auto' }); }).join('') + '</div>' + tools + '</article>';
    }).join('');
  }

  function renderForm() {
    if (!editing) return '';
    var photos = editing.photos.map(function (u, i) {
      return '<div class="thumb"><img src="' + esc(u) + '" alt=""><button type="button" data-act="rmphoto" data-i="' + i + '" aria-label="Retirer cette photo">×</button></div>';
    }).join('');
    var m = editing.data || {};
    return '<form id="mform" class="form" novalidate>' +
      '<div class="grid2"><label><span class="req">Date</span><input type="date" name="date" required value="' + esc(m.date || '') + '"></label>' +
      '<label>Titre<input name="title" maxlength="120" value="' + esc(m.title || '') + '"></label></div>' +
      '<label>Texte (facultatif)<textarea name="text" style="min-height:90px">' + esc(m.text || '') + '</textarea></label>' +
      (photos ? '<div><strong>Photos actuelles</strong><div class="photo-edit">' + photos + '</div></div>' : '') +
      '<label>Ajouter des photos<input type="file" name="files" accept="image/*" multiple></label>' +
      '<p class="muted" style="margin:0">Les photos sont réduites automatiquement avant l\'envoi.</p>' +
      '<div class="actions-row"><button class="btn" type="submit">Enregistrer</button>' +
      '<button class="btn btn-ghost" type="button" data-act="cancel">Annuler</button></div>' +
      '<p class="status" id="mstatus" role="status"></p></form>';
  }

  function renderTools() {
    if (!canEdit()) { toolsRoot.innerHTML = CM.demoNotice(); return; }
    toolsRoot.innerHTML = CM.demoNotice() +
      '<section class="panel"><div class="row"><h2>Espace photographe</h2>' +
      (editing ? '' : '<button class="btn btn-sm" data-act="new">Nouvelle maraude</button>') + '</div>' +
      (editing ? renderForm() : '<p class="muted" style="margin:0">Publie les photos d\'une maraude : elles apparaissent ci-dessous pour tous les visiteurs.</p>') +
      '</section><div style="height:32px"></div>';
  }

  async function load() {
    try { dynamic = await B.listMaraudes(); } catch (e) { dynamic = []; console.error(e); }
    renderTools(); render();
  }

  async function onClick(ev) {
    var t = ev.target.closest('[data-act]'); if (!t) return;
    var act = t.dataset.act;
    try {
      if (act === 'new') { editing = { id: null, photos: [], data: {} }; renderTools(); }
      else if (act === 'cancel') { editing = null; renderTools(); }
      else if (act === 'rmphoto') { keepFields(); editing.photos.splice(Number(t.dataset.i), 1); renderTools(); }
      else if (act === 'edit') {
        var m = dynamic.find(function (x) { return x.id === t.dataset.id; });
        editing = { id: m.id, photos: (m.photos || []).slice(), data: { date: m.date, title: m.title, text: m.text } };
        renderTools(); window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      else if (act === 'del') {
        if (!confirm('Supprimer cette maraude et ses photos ?')) return;
        await B.deleteMaraude(t.dataset.id); CM.toast('Maraude supprimée.'); await load();
      }
    } catch (e) { CM.toast(e.message); }
  }

  /* Conserve les champs saisis quand on retire une photo (le formulaire est redessiné) */
  function keepFields() {
    var f = document.getElementById('mform'); if (!f) return;
    editing.data = { date: f.elements.date.value, title: f.elements.title.value, text: f.elements.text.value };
  }

  async function onSubmit(ev) {
    if (ev.target.id !== 'mform') return;
    ev.preventDefault();
    var f = ev.target;
    if (!f.reportValidity()) return;
    var st = document.getElementById('mstatus'), btn = f.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      var photos = editing.photos.slice();
      var files = Array.prototype.slice.call(f.elements.files.files);
      for (var i = 0; i < files.length; i++) {
        st.textContent = 'Envoi de la photo ' + (i + 1) + ' sur ' + files.length + '…';
        photos.push(await B.uploadPhoto(files[i]));
      }
      await B.saveMaraude({ id: editing.id, date: f.elements.date.value, title: f.elements.title.value.trim(), text: f.elements.text.value.trim(), photos: photos });
      editing = null;
      CM.toast('Maraude enregistrée.');
      await load();
    } catch (e) {
      st.textContent = e.message; st.className = 'status err'; btn.disabled = false;
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  window.addEventListener('cm:auth', function () { editing = null; load(); });
  CM.ready.then(load);
})();
