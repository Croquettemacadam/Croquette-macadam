/* Page d'accueil : actions, vidéo, compteurs d'impact, formulaire de contact. */
(function () {
  'use strict';
  var CM = window.CM, C = CM.C, CFG = CM.CFG, esc = CM.esc;

  /* Actions */
  var actionsList = document.getElementById('actions-list');
  function renderActions() { if (actionsList) actionsList.innerHTML = C.actions.items.map(function (a) {
    return '<article class="card">' + CM.photoFigure(a.photo, { ratio: '4 / 3' }) +
      '<div class="card-body"><h3>' + esc(a.title) + '</h3><p>' + esc(a.text) + '</p></div></article>';
  }).join(''); }
  renderActions();
  window.addEventListener('cm:photos', renderActions);

  /* Vidéo : miniature + lecture en grand au clic */
  var V = C.mission.video;
  var videoRoot = document.getElementById('video-root');
  if (V && V.id && videoRoot) {
    videoRoot.innerHTML =
      '<div style="margin-top:28px"><button type="button" class="video-card" aria-label="Lire la vidéo : ' + esc(V.title) + '">' +
        '<span class="video-thumb"><img src="https://i.ytimg.com/vi/' + esc(V.id) + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">' +
        '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>' +
        '<span class="video-meta"><strong>' + esc(V.title) + '</strong><small>Cliquer pour agrandir</small></span></button>' +
        (V.credit ? '<p class="credit">' + CM.rich(V.credit) + '</p>' : '') + '</div>';
    videoRoot.querySelector('.video-card').addEventListener('click', function () { CM.openVideo(V.id, V.title); });
  }

  /* Compteurs annuels : somme des bilans de maraudes enregistrés dans Supabase. */
  var counters = document.getElementById('impact-counters');
  if (counters) {
    var impactYear = new Date().getFullYear();
    var titleNode = document.querySelector('#impact h2');
    var yearPicker = document.createElement('label');
    yearPicker.className = 'impact-year-picker';
    yearPicker.innerHTML = 'Année <select aria-label="Année du bilan"></select>';
    var select = yearPicker.querySelector('select');
    for (var yy = new Date().getFullYear() + 1; yy >= 2025; yy--) {
      var opt = document.createElement('option'); opt.value = yy; opt.textContent = yy;
      if (yy === impactYear) opt.selected = true; select.appendChild(opt);
    }
    counters.parentNode.insertBefore(yearPicker, counters);
    async function loadImpactYear() {
      var year = Number(select.value);
      if (titleNode) titleNode.textContent = 'Notre impact en ' + year;
      counters.innerHTML = '<p class="muted">Chargement des chiffres…</p>';
      try {
        await CM.ready;
        var reports = await window.Backend.listImpactReports(year);
        var total = reports.reduce(function (a, r) {
          a.maraudes += Number(r.maraudes_count == null ? 1 : r.maraudes_count); a.kg += Number(r.kibble_kg || 0); a.leashes += Number(r.leashes || 0);
          a.harnesses += Number(r.harnesses || 0); a.toys += Number(r.toys || 0); return a;
        }, {maraudes:0,kg:0,leashes:0,harnesses:0,toys:0});
        var values = [
          {value:total.maraudes,label:'maraudes réalisées'},
          {value:total.kg,label:'kg de croquettes distribués'},
          {value:total.leashes,label:'laisses distribuées'},
          {value:total.harnesses,label:'harnais distribués'},
          {value:total.toys,label:'jouets distribués'}
        ];
        counters.innerHTML = values.map(function(c){
          return '<div class="counter"><span class="num" data-count="'+Number(c.value)+'">0</span><span class="lab">'+esc(c.label)+'</span></div>';
        }).join('');
        CM.animateCounters(counters);
      } catch (e) {
        counters.innerHTML = '<p class="muted">Les chiffres annuels ne sont pas disponibles pour le moment.</p>';
        console.error(e);
      }
    }
    select.addEventListener('change', loadImpactYear);
    loadImpactYear();
  }

  /* Formulaire de contact */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form) return; /* section Contact retirée de la page : rien à brancher */
  function say(msg, kind) { status.textContent = msg; status.className = 'status ' + (kind || ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.website.value) return; /* anti-spam : champ piège rempli par les robots */
    if (!form.reportValidity()) return;

    var f = form.elements;
    var data = {
      nom: f.nom.value.trim(), prenom: f.prenom.value.trim(), email: f.email.value.trim(),
      telephone: f.telephone.value.trim(), profil: f.profil.value, message: f.message.value.trim(),
      consentement: 'Oui : accepte que l\'association recueille ses informations pour répondre à sa demande'
    };

    if (!CFG.contactEndpoint && /A_REMPLACER/.test(CFG.contactEmail)) {
      say('Le formulaire n\'est pas encore configuré (adresse e-mail de l\'association à renseigner dans js/config.js).', 'err');
      return;
    }

    var btn = form.querySelector('[type=submit]');
    if (CFG.contactEndpoint) {
      btn.disabled = true; say('Envoi en cours…');
      fetch(CFG.contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('Erreur ' + r.status);
        form.reset();
        say('Merci, votre message a bien été envoyé. Nous revenons vers vous rapidement.', 'ok');
      }).catch(function () {
        say('L\'envoi a échoué. Réessayez, ou écrivez-nous directement à ' + CFG.contactEmail + '.', 'err');
      }).then(function () { btn.disabled = false; });
    } else {
      var subject = 'Message depuis le site – ' + data.profil;
      var body = [
        'Nom : ' + data.nom, 'Prénom : ' + data.prenom, 'E-mail : ' + data.email,
        'Téléphone : ' + (data.telephone || 'non renseigné'), 'Profil : ' + data.profil, '',
        data.message, '', data.consentement
      ].join('\n');
      window.location.href = 'mailto:' + CFG.contactEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      say('Votre application de messagerie va s\'ouvrir avec le message prérempli : il ne reste qu\'à l\'envoyer.', 'ok');
    }
  });
})();
