/* Page d'accueil : actions, vidéo, compteurs d'impact, formulaire de contact. */
(function () {
  'use strict';
  var CM = window.CM, C = CM.C, CFG = CM.CFG, esc = CM.esc;

  /* Actions */
  document.getElementById('actions-list').innerHTML = C.actions.items.map(function (a) {
    return '<article class="card">' + CM.photoFigure(a.photo, { ratio: '4 / 3' }) +
      '<div class="card-body"><h3>' + esc(a.title) + '</h3><p>' + esc(a.text) + '</p></div></article>';
  }).join('');

  /* Vidéo : miniature + lecture en grand au clic */
  var V = C.mission.video;
  var videoRoot = document.getElementById('video-root');
  if (V && V.id && videoRoot) {
    videoRoot.innerHTML =
      '<div style="margin-top:28px"><button type="button" class="video-card" aria-label="Lire la vidéo : ' + esc(V.title) + '">' +
        '<span class="video-thumb"><img src="https://i.ytimg.com/vi/' + esc(V.id) + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">' +
        '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>' +
        '<span class="video-meta"><strong>' + esc(V.title) + '</strong><small>Cliquer pour agrandir</small></span></button>' +
        (V.credit ? '<p class="credit">' + esc(V.credit) + '</p>' : '') + '</div>';
    videoRoot.querySelector('.video-card').addEventListener('click', function () { CM.openVideo(V.id, V.title); });
  }

  /* Compteurs */
  document.getElementById('impact-counters').innerHTML = C.impact.counters.map(function (c) {
    return '<div class="counter"><span class="num" data-count="' + Number(c.value) + '">0</span><span class="lab">' + esc(c.label) + '</span></div>';
  }).join('');
  CM.animateCounters();

  /* Formulaire de contact */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
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
