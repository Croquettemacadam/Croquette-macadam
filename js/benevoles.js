/* Page Bénévoles : équipe, événements publics, espace connecté
   (calendrier d'inscription, administration, fiches du président). */
(function () {
  'use strict';
  var CM = window.CM, C = CM.C, esc = CM.esc, B = window.Backend, BC = C.benevoles;
  var root = document.getElementById('espace-root');

  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var now = new Date();
  var state = { tab: 'calendrier', y: now.getFullYear(), m: now.getMonth(), sel: null, events: [], regs: [], fiches: [], users: [], editFiche: null, q: '' };

  /* ---------- Parties publiques ---------- */
  document.getElementById('equipe-root').innerHTML = BC.team.map(function (p) {
    return '<article class="card team-card">' + CM.photoFigure(p.photo, { shape: 'circle', ratio: '1 / 1' }) +
      '<div class="card-body"><h3>' + esc(p.name) + '</h3><p class="role">' + esc(p.role) + '</p><p>' + esc(p.text) + '</p></div></article>';
  }).join('');
  document.getElementById('forums-root').innerHTML = BC.events.map(function (e) {
    return '<article class="card">' + CM.photoFigure(e.photo, { ratio: '16 / 10' }) +
      '<div class="card-body"><p class="date">' + esc(e.date) + '</p><h3>' + esc(e.title) + '</h3><p class="place">' + esc(e.place) + '</p><p>' + esc(e.text) + '</p></div></article>';
  }).join('');

  /* ---------- Chargement des données selon l'onglet ---------- */
  async function loadTab() {
    var u = B.user();
    if (state.tab === 'admin' && u.role !== 'admin') state.tab = 'calendrier';
    if (state.tab === 'calendrier' || state.tab === 'admin') {
      var r = await Promise.all([B.listEvents(), B.listRegistrations()]);
      state.events = r[0]; state.regs = r[1];
    }
    if (state.tab === 'admin' && B.canManageAccounts) state.users = await B.listUsers();
    if (state.tab === 'fiches') state.fiches = await B.listFiches();
  }

  var renderSeq = 0;
  async function renderEspace() {
    var seq = ++renderSeq; /* ignore les affichages devenus obsolètes (ex. déconnexion pendant le chargement) */
    var u = B.user();
    if (CM.initError) {
      root.innerHTML = '<div class="notice err">Le service de données n\'est pas disponible : ' + esc(CM.initError.message) + '</div>';
      return;
    }
    if (!u) {
      root.innerHTML = CM.demoNotice() +
        '<div class="panel"><h3>Accès réservé</h3><p class="muted">Tu as reçu un identifiant et un code de la part du bureau ? Connecte-toi pour voir le calendrier et t\'inscrire.</p>' +
        '<button class="btn" type="button" data-act="login">Se connecter</button></div>';
      return;
    }
    try { await loadTab(); } catch (e) {
      if (seq === renderSeq) root.innerHTML = '<div class="notice err">' + esc(e.message) + '</div>';
      return;
    }
    if (seq !== renderSeq) return;
    if (!B.user()) return renderEspace();
    paint();
  }

  function paint() {
    var u = B.user();
    var tabs = [['calendrier', 'Calendrier']];
    tabs.push(['fiches', 'Fiches bénéficiaires']);
    if (u.role === 'admin') tabs.push(['admin', 'Administration']);
    var extra = (u.role === 'photographe' || u.role === 'admin')
      ? '<a class="btn btn-ghost btn-sm" href="maraudes.html">Gérer les photos des maraudes</a>' : '';
    var body = state.tab === 'admin' ? adminHtml() : state.tab === 'fiches' ? fichesHtml() : calendarHtml(u);
    root.innerHTML = CM.demoNotice() +
      '<div class="row"><p style="margin:0">Connecté : <strong>' + esc(u.name) + '</strong> <span class="muted">(' + esc(CM.ROLE_LABEL[u.role]) + ')</span></p>' + extra + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) {
        return '<button class="tab" role="tab" type="button" data-act="tab" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div>' + body;
  }

  /* ---------- Calendrier ---------- */
  function calendarHtml(u) {
    var first = new Date(state.y, state.m, 1);
    var offset = (first.getDay() + 6) % 7;
    var nDays = new Date(state.y, state.m + 1, 0).getDate();
    var prefix = state.y + '-' + pad(state.m + 1) + '-';
    var today = ymd(new Date());
    var cells = '';
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(function (d) { cells += '<span class="dow">' + d + '</span>'; });
    for (var i = 0; i < offset; i++) cells += '<span class="day empty"></span>';
    for (var d = 1; d <= nDays; d++) {
      var date = prefix + pad(d);
      var evs = state.events.filter(function (e) { return e.date === date; });
      var dots = evs.map(function (e) { return '<i class="dot ' + esc(e.kind) + '"></i>'; }).join('');
      var cls = 'day' + (date === today ? ' today' : '') + (date === state.sel ? ' sel' : '');
      cells += '<button type="button" class="' + cls + '" data-act="day" data-date="' + date + '" aria-label="' + esc(CM.fmtDate(date)) +
        (evs.length ? ', ' + evs.length + ' événement(s)' : '') + '"><span>' + d + '</span><span class="dots">' + dots + '</span></button>';
    }
    var label = first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    var list = state.events.filter(function (e) { return e.date.indexOf(prefix) === 0; });
    if (state.sel) list = list.filter(function (e) { return e.date === state.sel; });
    list.sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });

    return '<div class="panel">' +
      '<div class="cal-head"><button class="btn btn-ghost btn-sm" type="button" data-act="prev" aria-label="Mois précédent">&larr;</button>' +
      '<h3>' + esc(label) + '</h3>' +
      '<button class="btn btn-ghost btn-sm" type="button" data-act="next" aria-label="Mois suivant">&rarr;</button></div>' +
      '<div class="cal">' + cells + '</div>' +
      '<div class="legend"><span><i class="dot"></i>Maraude</span><span><i class="dot evenement"></i>Événement</span></div>' +
      (state.sel ? '<p><button class="btn btn-ghost btn-sm" type="button" data-act="allmonth">Voir tout le mois</button></p>' : '') +
      (list.length ? list.map(function (e) { return eventHtml(e, u); }).join('') : '<p class="muted">Aucun événement ' + (state.sel ? 'ce jour-là' : 'ce mois-ci') + '.</p>') +
      '</div>';
  }

  function eventHtml(e, u) {
    var regs = state.regs.filter(function (r) { return r.event_id === e.id; });
    var mine = regs.find(function (r) { return r.user_id === u.id; });
    var past = e.date < ymd(new Date());
    var full = e.capacity && regs.length >= e.capacity && !mine;
    var names = regs.length
      ? '<ul class="regs">' + regs.map(function (r) { return '<li><strong>' + esc(r.display_name) + '</strong>' + (r.note ? ' : ' + esc(r.note) : '') + '</li>'; }).join('') + '</ul>'
      : '<p class="muted" style="margin:8px 0">Personne d\'inscrit pour l\'instant.</p>';
    var form;
    if (past) form = '<p class="muted" style="margin:0">Terminé.</p>';
    else if (full) form = '<p class="muted" style="margin:0">Complet.</p>';
    else form = '<form class="reg-form" data-form="reg" data-event="' + esc(e.id) + '">' +
      '<label>Note pour l\'équipe (facultatif)<input name="note" maxlength="140" placeholder="Ex. j\'arrive vers 15h30" value="' + esc(mine ? mine.note : '') + '"></label>' +
      '<button class="btn btn-sm" type="submit">' + (mine ? 'Mettre à jour la note' : 'Je m\'inscris') + '</button>' +
      (mine ? '<button class="btn btn-danger btn-sm" type="button" data-act="unreg" data-event="' + esc(e.id) + '">Me désinscrire</button>' : '') + '</form>';
    return '<div class="event"><h4>' + esc(e.title) + '<span class="badge ' + esc(e.kind) + '">' + (e.kind === 'maraude' ? 'Maraude' : 'Événement') + '</span></h4>' +
      '<p class="muted" style="margin:0">' + esc(CM.fmtDate(e.date)) + (e.time ? ' à ' + esc(e.time) : '') + (e.place ? ' · ' + esc(e.place) : '') + '</p>' +
      (e.description ? '<p style="margin:8px 0 0">' + esc(e.description) + '</p>' : '') +
      '<p style="margin:10px 0 0"><strong>' + regs.length + (e.capacity ? ' / ' + e.capacity : '') + ' inscrit(s)</strong></p>' + names + form + '</div>';
  }

  /* ---------- Administration ---------- */
  function adminHtml() {
    var today = ymd(new Date());
    var up = state.events.filter(function (e) { return e.date >= today; })
      .sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
    var evList = up.length ? up.map(function (e) {
      var n = state.regs.filter(function (r) { return r.event_id === e.id; }).length;
      return '<div class="row" style="border-bottom:1px solid var(--line);padding-bottom:10px"><span>' + esc(CM.fmtDate(e.date)) + (e.time ? ' ' + esc(e.time) : '') + ' : <strong>' + esc(e.title) + '</strong> <span class="muted">(' + n + ' inscrit(s))</span></span>' +
        '<button class="btn btn-danger btn-sm" type="button" data-act="delevent" data-id="' + esc(e.id) + '">Supprimer</button></div>';
    }).join('') : '<p class="muted">Aucun événement à venir.</p>';

    var roleOpts = B.ROLES.map(function (r) { return '<option value="' + r + '">' + esc(CM.ROLE_LABEL[r]) + '</option>'; }).join('');
    var accounts = B.canManageAccounts
      ? '<section class="panel"><h3>Comptes bénévoles</h3>' +
        '<p class="muted">Pas d\'e-mail demandé : un identifiant, un prénom affiché et un code que tu remets en main propre.</p>' +
        state.users.map(function (x) {
          return '<div class="row" style="border-bottom:1px solid var(--line);padding-bottom:10px"><span><strong>' + esc(x.username) + '</strong> : ' + esc(x.name) + ' <span class="muted">(' + esc(CM.ROLE_LABEL[x.role]) + ')</span></span>' +
            '<span class="actions-row" style="margin:0"><button class="btn btn-ghost btn-sm" type="button" data-act="resetcode" data-u="' + esc(x.username) + '">Nouveau code</button>' +
            '<button class="btn btn-danger btn-sm" type="button" data-act="deluser" data-u="' + esc(x.username) + '">Supprimer</button></span></div>';
        }).join('') +
        '<h4 style="margin:20px 0 10px">Ajouter un compte</h4>' +
        '<form class="form" data-form="user"><div class="grid2"><label><span class="req">Identifiant</span><input name="username" required autocapitalize="none"></label>' +
        '<label><span class="req">Prénom affiché</span><input name="name" required></label></div>' +
        '<div class="grid2"><label><span class="req">Rôle</span><select name="role">' + roleOpts + '</select></label>' +
        '<label><span class="req">Code (6 caractères minimum)</span><input name="code" type="text" required minlength="6" autocomplete="off"></label></div>' +
        '<div><button class="btn btn-sm" type="submit">Créer le compte</button></div></form></section>'
      : '<section class="panel"><h3>Comptes bénévoles</h3><p class="muted">En mode Supabase, les comptes se créent dans le tableau de bord Supabase (voir README, étape « Créer les comptes »).</p></section>';

    var reset = B.mode === 'demo'
      ? '<section class="panel"><h3>Données de démonstration</h3><p class="muted">Efface toutes les données de ce navigateur et recrée les comptes d\'exemple.</p><button class="btn btn-danger btn-sm" type="button" data-act="resetdemo">Réinitialiser la démo</button></section>' : '';

    return '<section class="panel"><h3>Événements</h3>' +
      '<form class="form" data-form="event"><div class="grid2"><label><span class="req">Date</span><input type="date" name="date" required></label>' +
      '<label>Heure<input type="time" name="time"></label></div>' +
      '<div class="grid2"><label><span class="req">Type</span><select name="kind"><option value="maraude">Maraude</option><option value="evenement">Événement</option></select></label>' +
      '<label>Places max (facultatif)<input type="number" name="capacity" min="1"></label></div>' +
      '<label><span class="req">Titre</span><input name="title" required value="Maraude du dimanche"></label>' +
      '<label>Lieu<input name="place"></label><label>Description<textarea name="description" style="min-height:70px"></textarea></label>' +
      '<div><button class="btn btn-sm" type="submit">Ajouter l\'événement</button></div></form>' +
      '<h4 style="margin:24px 0 10px">Créer les maraudes de plusieurs dimanches d\'un coup</h4>' +
      '<form class="form" data-form="sundays"><div class="grid2"><label>Nombre de semaines<input type="number" name="weeks" min="1" max="52" value="8"></label>' +
      '<label>Heure<input type="time" name="time"></label></div><label>Lieu<input name="place"></label>' +
      '<div><button class="btn btn-ghost btn-sm" type="submit">Générer les dimanches</button></div></form>' +
      '<h4 style="margin:24px 0 10px">À venir</h4>' + evList + '</section>' + accounts + reset +
      '<section class="panel"><h3>Textes et photos du site</h3><p class="muted" style="margin:0">Les textes, photos, chiffres et informations légales se modifient dans <code>js/content.js</code> et le dossier <code>assets/img/</code> sur GitHub (voir README).</p></section>';
  }

  /* ---------- Fiches (lecture pour tous, modification par le président) ---------- */
  var FICHE_FIELDS = [['personne', 'Prénom ou pseudo de la personne'], ['animal', "Nom de l'animal"], ['espece', 'Espèce'], ['besoins', 'Besoins'], ['suivi_veto', 'Suivi vétérinaire'], ['derniere_maraude', 'Dernière maraude'], ['secteur', 'Secteur général (jamais le lieu exact)'], ['notes', 'Notes']];

  function ficheCard(f) {
    var rows = FICHE_FIELDS.filter(function (x) { return f[x[0]]; }).map(function (x) {
      return '<dt>' + esc(x[1]) + '</dt><dd>' + esc(x[0] === 'derniere_maraude' ? CM.fmtDate(f[x[0]]) : f[x[0]]) + '</dd>';
    }).join('');
    var pic = (f.photo && /^data:image\//.test(f.photo)) ? '<img class="fiche-photo" src="' + esc(f.photo) + '" alt="Photo de ' + esc(f.animal || 'l\'animal') + '">' : '';
    return '<div class="fiche">' + pic + '<div class="fiche-main"><h4 style="margin:0">' + esc(f.animal || 'Animal sans nom') + ' <span class="muted">· ' + esc(f.personne || 'personne non renseignée') + '</span></h4>' +
      '<dl>' + rows + '<dt>Consentement</dt><dd>' + (f.consentement ? 'recueilli' : '<strong style="color:var(--err)">non recueilli</strong>') + '</dd></dl>' +
      (canEditFiches()
        ? '<div class="actions-row"><button class="btn btn-ghost btn-sm" type="button" data-act="editfiche" data-id="' + esc(f.id) + '">Modifier</button>' +
          '<button class="btn btn-danger btn-sm" type="button" data-act="delfiche" data-id="' + esc(f.id) + '">Supprimer</button></div>'
        : '') + '</div></div>';
  }
  function filteredFiches() {
    var q = state.q.trim().toLowerCase();
    return state.fiches.filter(function (f) {
      return !q || [f.personne, f.animal, f.espece, f.secteur].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  /* Tous les comptes connectés lisent les fiches ; seul le président les modifie (et le serveur le vérifie aussi). */
  function canEditFiches() { var u = B.user(); return !!u && u.role === 'president'; }
  function fichesHtml() { return canEditFiches() ? fichesEditHtml() : fichesReadHtml(); }
  function fichesReadHtml() {
    return '<div class="notice"><strong>Informations confidentielles.</strong> Ces fiches sont réservées aux bénévoles de l\'association : ne les copie pas, ne les partage pas, ne prends pas de photo de l\'écran. Seul le président peut les modifier.</div>' +
      '<section class="panel"><div class="row"><h3>Fiches (' + state.fiches.length + ')</h3><label style="min-width:240px"><span class="sr-only">Rechercher</span><input type="search" name="q" placeholder="Rechercher…" value="' + esc(state.q) + '"></label></div>' +
      '<div id="fiche-list">' + (filteredFiches().map(ficheCard).join('') || '<p class="muted">Aucune fiche.</p>') + '</div></section>';
  }
  function fichesEditHtml() {
    var f = state.editFiche || {};
    var inputs = '<div class="grid2"><label><span class="req">Prénom ou pseudo</span><input name="personne" required value="' + esc(f.personne || '') + '"></label>' +
      '<label><span class="req">Nom de l\'animal</span><input name="animal" required value="' + esc(f.animal || '') + '"></label></div>' +
      '<div class="grid2"><label>Espèce<input name="espece" value="' + esc(f.espece || '') + '"></label>' +
      '<label>Secteur général<input name="secteur" placeholder="Ex. centre-ville" value="' + esc(f.secteur || '') + '"></label></div>' +
      '<label>Besoins<textarea name="besoins" style="min-height:70px">' + esc(f.besoins || '') + '</textarea></label>' +
      '<label>Suivi vétérinaire<textarea name="suivi_veto" style="min-height:70px">' + esc(f.suivi_veto || '') + '</textarea></label>' +
      '<div class="grid2"><label>Dernière maraude<input type="date" name="derniere_maraude" value="' + esc(f.derniere_maraude || '') + '"></label><span></span></div>' +
      '<div class="photo-field"><span>Photo de l\'animal (pas de photo de personne)</span>' +
        (f.photo ? '<img class="fiche-photo" id="fiche-photo-preview" src="' + esc(f.photo) + '" alt="Photo actuelle">' : '') +
        '<input type="file" name="photofile" accept="image/*">' +
        (f.photo ? '<label class="check"><input type="checkbox" name="photoremove"><span>Retirer la photo</span></label>' : '') + '</div>' +
      '<label>Notes<textarea name="notes" style="min-height:70px">' + esc(f.notes || '') + '</textarea></label>' +
      '<label class="check"><input type="checkbox" name="consentement"' + (f.consentement ? ' checked' : '') + '><span>La personne a été informée et a donné son accord pour l\'enregistrement de ces informations.</span></label>';
    return '<div class="notice"><strong>Données sensibles.</strong> Enregistre le strict minimum : pas de lieu exact, pas de photo de personne, pas de pièce d\'identité, pas de données de santé de la personne. Ces fiches sont visibles en lecture par tous les bénévoles connectés : écris-les en conséquence.</div>' +
      '<section class="panel"><h3>' + (f.id ? 'Modifier la fiche' : 'Nouvelle fiche') + '</h3><form class="form" data-form="fiche">' + inputs +
      '<div class="actions-row"><button class="btn btn-sm" type="submit">Enregistrer</button>' +
      (f.id ? '<button class="btn btn-ghost btn-sm" type="button" data-act="newfiche">Annuler</button>' : '') + '</div></form></section>' +
      '<section class="panel"><div class="row"><h3>Fiches (' + state.fiches.length + ')</h3><label style="min-width:240px"><span class="sr-only">Rechercher</span><input type="search" name="q" placeholder="Rechercher…" value="' + esc(state.q) + '"></label></div>' +
      '<div id="fiche-list">' + (filteredFiches().map(ficheCard).join('') || '<p class="muted">Aucune fiche.</p>') + '</div></section>';
  }

  /* ---------- Actions ---------- */
  async function refresh() { await loadTab(); paint(); }

  root.addEventListener('click', async function (ev) {
    var t = ev.target.closest('[data-act]'); if (!t) return;
    var act = t.dataset.act;
    try {
      if (act === 'login') CM.openLogin();
      else if (act === 'tab') { state.tab = t.dataset.tab; state.sel = null; await renderEspace(); }
      else if (act === 'prev' || act === 'next') {
        state.m += act === 'next' ? 1 : -1;
        if (state.m < 0) { state.m = 11; state.y--; } else if (state.m > 11) { state.m = 0; state.y++; }
        state.sel = null; paint();
      }
      else if (act === 'day') { state.sel = state.sel === t.dataset.date ? null : t.dataset.date; paint(); }
      else if (act === 'allmonth') { state.sel = null; paint(); }
      else if (act === 'unreg') { await B.removeRegistration(t.dataset.event); CM.toast('Désinscription enregistrée.'); await refresh(); }
      else if (act === 'delevent') { if (confirm('Supprimer cet événement et ses inscriptions ?')) { await B.deleteEvent(t.dataset.id); await refresh(); } }
      else if (act === 'deluser') { if (confirm('Supprimer le compte « ' + t.dataset.u + ' » ?')) { await B.deleteUser(t.dataset.u); await refresh(); } }
      else if (act === 'resetcode') {
        var c = prompt('Nouveau code pour « ' + t.dataset.u + ' » (6 caractères minimum) :');
        if (c) { await B.resetCode(t.dataset.u, c); CM.toast('Code modifié.'); }
      }
      else if (act === 'resetdemo') { if (confirm('Effacer toutes les données de démonstration ?')) { await B.resetDemo(); } }
      else if (act === 'editfiche') { state.editFiche = state.fiches.find(function (f) { return f.id === t.dataset.id; }); paint(); window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' }); }
      else if (act === 'newfiche') { state.editFiche = null; paint(); }
      else if (act === 'delfiche') { if (confirm('Supprimer cette fiche définitivement ?')) { await B.deleteFiche(t.dataset.id); await refresh(); } }
    } catch (e) { CM.toast(e.message); }
  });

  root.addEventListener('submit', async function (ev) {
    var form = ev.target; var kind = form.dataset.form; if (!kind) return;
    ev.preventDefault();
    if (!form.reportValidity()) return;
    var fd = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      fd[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    try {
      if (kind === 'reg') { await B.setRegistration(form.dataset.event, fd.note.trim()); CM.toast('Inscription enregistrée.'); }
      else if (kind === 'event') {
        await B.createEvent({ date: fd.date, time: fd.time, kind: fd.kind, title: fd.title.trim(), place: fd.place.trim(), capacity: parseInt(fd.capacity, 10) || null, description: fd.description.trim() });
        CM.toast('Événement ajouté.');
      }
      else if (kind === 'sundays') {
        var weeks = Math.min(Math.max(parseInt(fd.weeks, 10) || 8, 1), 52);
        var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
        var have = {}; state.events.forEach(function (e) { if (e.kind === 'maraude') have[e.date] = true; });
        var n = 0;
        for (var i = 0; i < weeks; i++) {
          var date = ymd(d);
          if (!have[date]) { await B.createEvent({ date: date, time: fd.time, kind: 'maraude', title: 'Maraude du dimanche', place: fd.place.trim(), capacity: null, description: '' }); n++; }
          d.setDate(d.getDate() + 7);
        }
        CM.toast(n + ' maraude(s) créée(s).');
      }
      else if (kind === 'user') { await B.createUser({ username: fd.username, name: fd.name.trim(), role: fd.role, code: fd.code }); CM.toast('Compte créé.'); }
      else if (kind === 'fiche') {
        var base = state.editFiche ? { id: state.editFiche.id } : {};
        var photo = state.editFiche && state.editFiche.photo || '';
        if (fd.photoremove) photo = '';
        var pf = form.elements.photofile && form.elements.photofile.files[0];
        if (pf) photo = await B.fichePhoto(pf);
        await B.saveFiche(Object.assign(base, { personne: fd.personne.trim(), animal: fd.animal.trim(), espece: fd.espece.trim(), besoins: fd.besoins.trim(), suivi_veto: fd.suivi_veto.trim(), derniere_maraude: fd.derniere_maraude, secteur: fd.secteur.trim(), notes: fd.notes.trim(), photo: photo, consentement: fd.consentement }));
        state.editFiche = null; CM.toast('Fiche enregistrée.');
      }
      await refresh();
    } catch (e) { CM.toast(e.message); }
  });

  root.addEventListener('input', function (ev) {
    if (ev.target.name === 'q') {
      state.q = ev.target.value;
      var list = document.getElementById('fiche-list');
      if (list) list.innerHTML = filteredFiches().map(ficheCard).join('') || '<p class="muted">Aucune fiche.</p>';
    }
  });

  window.addEventListener('cm:auth', function () { state.tab = 'calendrier'; state.sel = null; state.editFiche = null; renderEspace(); });
  CM.ready.then(renderEspace);
})();
