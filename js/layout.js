/* ==========================================================================
   Éléments communs à toutes les pages : en-tête fixe, vagues, photos libres,
   pied de page, connexion, vidéo. Expose window.CM pour les scripts de page.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.SITE_CONTENT;
  var CFG = window.SITE_CONFIG;
  var B = window.Backend;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  var isIndex = /(^|\/)(index\.html)?$/.test(location.pathname);
  var current = isIndex ? 'index' : (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  function link(hash) { return isIndex ? hash : 'index.html' + hash; }
  var ROLE_LABEL = { benevole: 'Bénévole', photographe: 'Photographe', president: 'Président', admin: 'Administrateur' };
  var IG_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>';
  var PAW = '<svg class="paw" viewBox="40 47 215 215" aria-hidden="true"><g class="paw-bg"><circle cx="78.2" cy="103.1" r="26.5"/><circle cx="221.6" cy="170.0" r="26.6"/><circle cx="199.6" cy="109.9" r="26.5"/><circle cx="138.3" cy="81.2" r="26.5"/><path d="M58.0 160.7C56.3 162.6 54.8 164.7 53.4 167.1C52.1 169.5 50.9 172.3 50.0 175.0C49.1 177.7 48.5 180.7 48.3 183.2C48.0 185.8 48.1 188.0 48.5 190.5C48.9 193.0 49.7 196.0 50.6 198.5C51.6 201.0 52.9 203.4 54.4 205.7C56.0 207.9 58.0 210.3 60.0 212.2C62.0 214.1 63.9 215.8 66.5 217.2C69.2 218.7 71.0 219.9 75.8 221.0C80.5 222.2 89.7 223.1 94.8 224.3C99.8 225.5 102.5 226.4 106.2 228.1C110.0 229.8 112.7 231.2 117.3 234.6C121.9 238.1 130.1 245.9 134.1 248.8C138.0 251.7 138.3 251.2 140.8 252.1C143.2 253.0 145.7 253.9 148.8 254.3C151.8 254.6 155.8 254.9 159.2 254.4C162.7 253.9 166.3 252.8 169.5 251.3C172.7 249.8 175.8 247.7 178.5 245.3C181.2 242.9 183.5 240.3 185.4 237.0C187.4 233.6 189.3 229.5 190.1 225.2C191.0 221.0 190.8 215.3 190.5 211.8C190.2 208.2 190.0 207.5 188.5 203.8C186.9 200.0 182.7 193.0 181.0 189.5C179.4 186.0 179.4 188.8 178.6 182.8C177.9 176.7 177.4 159.1 176.7 153.0C175.9 146.9 175.2 148.3 174.1 146.0C172.9 143.7 171.1 141.0 169.5 138.9C168.0 136.9 166.5 135.3 164.7 133.7C162.8 132.0 160.5 130.3 158.2 128.9C155.8 127.5 153.1 126.2 150.5 125.2C147.9 124.3 145.7 123.7 142.8 123.3C139.8 123.0 135.5 122.9 132.5 123.2C129.5 123.4 127.8 123.6 124.8 124.7C121.7 125.8 118.9 126.7 114.2 129.9C109.5 133.0 100.5 141.0 96.5 143.8C92.4 146.6 94.0 145.3 89.7 146.5C85.5 147.7 75.3 149.7 71.0 151.2C66.7 152.6 66.1 153.7 63.9 155.2C61.8 156.8 59.8 158.7 58.0 160.7Z"/></g><g class="paw-fg"><circle cx="78.2" cy="103.1" r="19.1" stroke-width="14.7"/><circle cx="221.6" cy="170.0" r="19.2" stroke-width="14.8"/><circle cx="199.6" cy="109.9" r="19.1" stroke-width="14.7"/><circle cx="138.3" cy="81.2" r="19.1" stroke-width="14.7"/><path fill-rule="evenodd" d="M58.0 160.7C56.3 162.6 54.8 164.7 53.4 167.1C52.1 169.5 50.9 172.3 50.0 175.0C49.1 177.7 48.5 180.7 48.3 183.2C48.0 185.8 48.1 188.0 48.5 190.5C48.9 193.0 49.7 196.0 50.6 198.5C51.6 201.0 52.9 203.4 54.4 205.7C56.0 207.9 58.0 210.3 60.0 212.2C62.0 214.1 63.9 215.8 66.5 217.2C69.2 218.7 71.0 219.9 75.8 221.0C80.5 222.2 89.7 223.1 94.8 224.3C99.8 225.5 102.5 226.4 106.2 228.1C110.0 229.8 112.7 231.2 117.3 234.6C121.9 238.1 130.1 245.9 134.1 248.8C138.0 251.7 138.3 251.2 140.8 252.1C143.2 253.0 145.7 253.9 148.8 254.3C151.8 254.6 155.8 254.9 159.2 254.4C162.7 253.9 166.3 252.8 169.5 251.3C172.7 249.8 175.8 247.7 178.5 245.3C181.2 242.9 183.5 240.3 185.4 237.0C187.4 233.6 189.3 229.5 190.1 225.2C191.0 221.0 190.8 215.3 190.5 211.8C190.2 208.2 190.0 207.5 188.5 203.8C186.9 200.0 182.7 193.0 181.0 189.5C179.4 186.0 179.4 188.8 178.6 182.8C177.9 176.7 177.4 159.1 176.7 153.0C175.9 146.9 175.2 148.3 174.1 146.0C172.9 143.7 171.1 141.0 169.5 138.9C168.0 136.9 166.5 135.3 164.7 133.7C162.8 132.0 160.5 130.3 158.2 128.9C155.8 127.5 153.1 126.2 150.5 125.2C147.9 124.3 145.7 123.7 142.8 123.3C139.8 123.0 135.5 122.9 132.5 123.2C129.5 123.4 127.8 123.6 124.8 124.7C121.7 125.8 118.9 126.7 114.2 129.9C109.5 133.0 100.5 141.0 96.5 143.8C92.4 146.6 94.0 145.3 89.7 146.5C85.5 147.7 75.3 149.7 71.0 151.2C66.7 152.6 66.1 153.7 63.9 155.2C61.8 156.8 59.8 158.7 58.0 160.7Z M67.6 171.7C69.0 169.5 70.1 168.8 71.7 167.6C73.2 166.4 73.2 165.7 77.0 164.5C80.8 163.4 89.8 162.0 94.2 160.7C98.7 159.4 101.1 158.0 103.7 156.7C106.4 155.4 107.1 154.9 110.0 152.6C112.8 150.4 117.9 145.2 120.9 143.0C123.9 140.8 124.8 140.1 127.8 139.2C130.7 138.3 135.8 137.7 138.5 137.6C141.2 137.5 142.5 138.0 144.2 138.4C146.0 138.8 146.7 138.7 149.0 140.2C151.2 141.8 155.3 144.6 157.6 147.5C159.9 150.5 161.6 155.1 162.6 157.8C163.6 160.4 163.4 159.8 163.5 163.2C163.6 166.7 163.0 174.2 163.2 178.2C163.3 182.2 163.9 184.5 164.6 187.2C165.2 190.0 165.6 191.3 167.2 194.8C168.8 198.2 172.7 204.8 174.2 208.0C175.6 211.2 175.6 211.5 175.9 213.8C176.2 216.0 176.2 219.0 175.9 221.2C175.5 223.5 174.9 225.4 173.8 227.5C172.7 229.5 171.0 231.9 169.2 233.6C167.5 235.3 165.4 236.6 163.2 237.6C161.1 238.6 158.7 239.4 156.2 239.7C153.8 240.0 151.2 239.8 148.8 239.3C146.3 238.7 145.4 238.9 141.6 236.2C137.8 233.5 131.1 226.8 126.1 223.3C121.2 219.8 116.4 217.1 112.0 215.0C107.6 212.9 104.9 211.9 99.8 210.6C94.6 209.4 85.3 208.4 81.3 207.5C77.2 206.7 77.6 206.8 75.3 205.4C73.0 204.0 69.6 201.5 67.6 198.9C65.7 196.4 64.2 193.3 63.5 190.2C62.8 187.2 62.7 183.6 63.4 180.5C64.1 177.4 66.2 173.8 67.6 171.7Z"/></g></svg>';

  function fmtDate(s) {
    if (!s) return '';
    var p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- Vagues : séparateurs entre sections et bas des bandeaux ---------- */
  function dividerHtml() {
    return '<svg class="wave-line" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="w2" d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40"/>' +
      '<path class="w1" d="M0,40 Q180,0 360,40 T720,40 T1080,40 T1440,40"/></svg>' + PAW;
  }
  function heroWaveHtml() {
    return '<svg viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0,52 C320,112 560,110 720,60 C880,10 1120,8 1440,70 L1440,100 L0,100 Z"/></svg>' + PAW;
  }

  /* ---------- Photos libres : forme, ratio, cadrage, collage ---------- */
  var SHAPES = ['rounded', 'arch', 'circle', 'blob', 'polaroid', 'square'];
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function ratioCss(v, d) {
    var s = String(v == null ? '' : v).trim();
    return /^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(s) ? s.replace(/\s*\/\s*/, ' / ') : d;
  }
  function focusCss(v) {
    var s = String(v == null ? '' : v).trim();
    return /^[a-z0-9%.\s]{1,30}$/i.test(s) ? s : '50% 50%';
  }

  /* p : { src, alt, shape, ratio, focus, caption, ... }   def : valeurs par défaut { shape, ratio, style } */
  function photoFigure(p, def) {
    if (!p) return '';
    if (typeof p === 'string') p = { src: p };
    def = def || {};
    var shape = SHAPES.indexOf(p.shape) >= 0 ? p.shape : (SHAPES.indexOf(def.shape) >= 0 ? def.shape : 'rounded');
    var wanted = p.ratio || def.ratio;
    var auto = wanted === 'auto';
    var style = [];
    if (!auto) style.push('--ratio:' + ratioCss(wanted, shape === 'circle' ? '1 / 1' : '4 / 3'));
    style.push('--focus:' + focusCss(p.focus));
    if (def.style) style.push(def.style);
    var cap = p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '';
    return '<figure class="ph shape-' + shape + (auto ? ' auto' : '') + (cap ? ' has-cap' : '') + '" style="' + style.join(';') + '">' +
      '<div class="ph-img"><img src="' + esc(p.src) + '" alt="' + esc(p.alt || '') + '" loading="lazy" onerror="this.parentNode.parentNode.classList.add(\'missing\');this.remove()">' +
      '<span class="ph-missing"><span>Photo à ajouter</span><code>' + esc(p.src) + '</code></span></div>' + cap + '</figure>';
  }

  /* Dispositions automatiques selon le nombre de photos (x, y, w en % du cadre) */
  var AUTO = {
    1: { cr: '10 / 7', items: [{ x: 6, y: 2, w: 88, ratio: '4 / 3', shape: 'rounded' }] },
    2: { cr: '1 / 1', items: [
      { x: 0, y: 0, w: 60, ratio: '4 / 5', shape: 'arch', rotate: -2, z: 1 },
      { x: 42, y: 42, w: 58, ratio: '1 / 1', shape: 'circle', rotate: 0, z: 2 }] },
    3: { cr: '1 / 1', items: [
      { x: 0, y: 0, w: 52, ratio: '3 / 4', shape: 'rounded', rotate: -2, z: 1 },
      { x: 56, y: 4, w: 44, ratio: '1 / 1', shape: 'circle', rotate: 0, z: 2 },
      { x: 26, y: 50, w: 62, ratio: '4 / 3', shape: 'rounded', rotate: 2, z: 3 }] }
  };
  function collage(photos, ratio) {
    var n = photos.length;
    if (!n) return '';
    var manual = photos.every(function (p) { return p && typeof p.x === 'number' && typeof p.y === 'number'; });
    if (n > 3 && !manual) {
      return '<div class="photos-grid">' + photos.map(function (p) { return photoFigure(p, { ratio: '4 / 3' }); }).join('') + '</div>';
    }
    var pre = AUTO[Math.min(n, 3)];
    var items = photos.map(function (p, i) {
      var d = pre.items[i] || { x: 0, y: 0, w: 50, ratio: '1 / 1', shape: 'rounded', rotate: 0, z: i + 1 };
      var m = Object.assign({}, d, p);
      var st = '--x:' + num(m.x, 0) + '%;--y:' + num(m.y, 0) + '%;--w:' + num(m.w, 50) + '%;--rot:' + num(m.rotate, 0) + 'deg;--z:' + num(m.z, i + 1);
      return photoFigure(m, { style: st });
    });
    return '<div class="collage" style="--cr:' + ratioCss(ratio, pre.cr) + '">' + items.join('') + '</div>';
  }

  function demoNotice() {
    if (CFG.mode === 'supabase') return '';
    return '<div class="notice"><strong>Mode démonstration.</strong> Les comptes, le calendrier, les photos et les fiches sont enregistrés uniquement dans ce navigateur : rien n\'est partagé entre appareils ni sécurisé. Passe en mode « supabase » (voir README) avant d\'utiliser le site avec de vraies données.</div>';
  }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  /* ---------- Liaison des textes, photos et décors du contenu ---------- */
  function bind(root) {
    root = root || document;
    root.querySelectorAll('[data-c]').forEach(function (n) {
      var v = get(C, n.dataset.c); if (v != null) n.textContent = v;
    });
    root.querySelectorAll('[data-paras]').forEach(function (n) {
      var v = get(C, n.dataset.paras);
      if (Array.isArray(v)) n.innerHTML = v.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    });
    root.querySelectorAll('[data-photos]').forEach(function (n) {
      var v = get(C, n.dataset.photos);
      if (Array.isArray(v)) n.innerHTML = collage(v, get(C, n.dataset.photos.replace(/photos$/, 'photosRatio')));
    });
    root.querySelectorAll('[data-bg]').forEach(function (n) {
      var src = get(C, n.dataset.bg);
      if (!src) return;
      var im = new Image();
      im.onload = function () {
        n.classList.add('has-bg');
        n.style.backgroundImage = 'linear-gradient(rgba(0,24,94,.6), rgba(0,24,94,.86)), url("' + String(src).replace(/["\\\n]/g, '') + '")';
      };
      im.src = src;
    });
    root.querySelectorAll('[data-divider]').forEach(function (n) { n.className = 'divider'; n.setAttribute('aria-hidden', 'true'); n.innerHTML = dividerHtml(); });
    root.querySelectorAll('[data-wave]').forEach(function (n) { n.className = 'hero-wave'; n.setAttribute('aria-hidden', 'true'); n.innerHTML = heroWaveHtml(); });
    root.querySelectorAll('[data-don]').forEach(function (a) {
      a.href = CFG.helloassoUrl; a.target = '_blank'; a.rel = 'noopener';
    });
    root.querySelectorAll('[data-ig]').forEach(function (a) {
      a.href = CFG.instagramUrl; a.target = '_blank'; a.rel = 'noopener';
    });
  }

  /* ---------- Compteurs animés ---------- */
  function animateCounters(root) {
    var nodes = (root || document).querySelectorAll('[data-count]');
    var fmt = function (n) { return Math.round(n).toLocaleString('fr-FR'); };
    function run(n) {
      var target = Number(n.dataset.count), start = performance.now(), dur = 1400;
      function step(t) {
        var k = Math.min(1, (t - start) / dur);
        n.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function (n) { n.textContent = fmt(Number(n.dataset.count)); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- En-tête fixe ---------- */
  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    host.className = 'site-header'; /* positionnement fixe : le menu reste en haut de l'écran */
    var items = [
      ['Mission', link('#mission'), 'mission'],
      ['Actions', link('#actions'), 'actions'],
      ['Impact', link('#impact'), 'impact'],
      ['Contact', link('#contact'), 'contact'],
      ['Maraudes', 'maraudes.html', 'maraudes'],
      ['Boutique', 'boutique.html', 'boutique'],
      ['Bénévoles', 'benevoles.html', 'benevoles']
    ];
    var lis = items.map(function (it) {
      return '<li><a href="' + it[1] + '" data-spy="' + it[2] + '"' + (current === it[2] ? ' aria-current="page"' : '') + '>' + it[0] + '</a></li>';
    }).join('');
    host.innerHTML =
      '<div class="bar">' +
        '<a class="brand" href="' + (isIndex ? '#accueil' : 'index.html') + '" aria-label="Accueil ' + esc(CFG.siteName) + '">' +
          '<span class="logo-slot"><img src="assets/img/logo.png" alt="' + esc(CFG.siteName) + '" onerror="this.parentNode.classList.add(\'empty\');this.remove()"></span>' +
          '<span class="brand-name">' + esc(CFG.siteName) + '</span></a>' +
        '<button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>' +
        '<div class="menu" id="menu">' +
          '<nav aria-label="Navigation principale"><ul>' + lis + '</ul></nav>' +
          '<div class="bar-actions">' +
            '<a class="icon-link" data-ig aria-label="Instagram (nouvel onglet)" title="Instagram">' + IG_SVG + '</a>' +
            '<a class="btn btn-sm" data-don>Faire un don</a>' +
            '<div id="auth-slot"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var burger = host.querySelector('.burger'), menu = host.querySelector('.menu');
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });

    if (isIndex && 'IntersectionObserver' in window) {
      var links = {};
      host.querySelectorAll('[data-spy]').forEach(function (a) { links[a.dataset.spy] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && links[e.target.id]) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
            links[e.target.id].classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      ['mission', 'actions', 'impact', 'contact'].forEach(function (id) {
        var s = document.getElementById(id); if (s) io.observe(s);
      });
    }
  }

  function renderAuth() {
    var slot = document.getElementById('auth-slot');
    if (!slot) return;
    var u = B.user();
    slot.innerHTML = u
      ? '<span class="user-chip" title="' + esc(ROLE_LABEL[u.role] || '') + '">' + esc(u.name) + '</span><button class="btn btn-ghost btn-sm" type="button" data-logout>Déconnexion</button>'
      : '<button class="btn btn-ghost btn-sm" type="button" data-login>Connexion</button>';
  }

  /* ---------- Pied de page ---------- */
  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.className = 'site-footer';
    var L = C.legal;
    var lines = [
      L.name + ' – ' + L.form,
      L.address,
      'Contact : ' + L.email,
      'Responsable de publication : ' + L.publicationDirector,
      'RNA : ' + L.rna + ' · SIRET : ' + L.siret,
      L.host
    ];
    host.innerHTML =
      '<div class="wrap foot">' +
        '<div><img class="foot-logo" src="assets/img/logo.png" alt="' + esc(CFG.siteName) + '">' +
          '<p class="muted">' + esc(C.hero.text) + '</p>' +
          '<div class="foot-links">' +
            '<a class="icon-link" data-ig aria-label="Instagram (nouvel onglet)" title="Instagram">' + IG_SVG + '</a>' +
            '<a class="btn btn-sm" data-don>Faire un don via HelloAsso</a>' +
          '</div></div>' +
        '<div><h2>Informations légales</h2>' +
          '<ul class="legal-list">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
          '<details><summary>Politique de confidentialité</summary>' +
            L.privacy.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</details></div>' +
        '<p class="copy">© ' + new Date().getFullYear() + ' ' + esc(CFG.siteName) + ' – Tous droits réservés</p>' +
      '</div>';
  }

  /* ---------- Fenêtre de connexion ---------- */
  function openLogin() {
    var dlg = document.getElementById('login-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'login-dialog';
      var accounts = (B.mode === 'demo' && B.demoAccounts)
        ? '<div class="demo-accounts"><strong>Comptes de démonstration</strong> : clique pour remplir.<div class="chips">' +
          B.demoAccounts.map(function (a, i) { return '<button type="button" class="chip" data-demo="' + i + '">' + esc(a.label) + '</button>'; }).join('') +
          '</div></div>' : '';
      dlg.innerHTML =
        '<form class="dialog-body" id="login-form" novalidate>' +
          '<h2 style="margin:0">Connexion</h2>' +
          '<p class="muted" style="margin:0">Identifiant et code remis par le bureau de l\'association.</p>' + accounts +
          '<label>Identifiant<input name="username" autocomplete="username" autocapitalize="none" required></label>' +
          '<label>Code<input name="code" type="password" autocomplete="current-password" required></label>' +
          '<p class="status err" id="login-err" role="alert"></p>' +
          '<div class="actions-row"><button class="btn" type="submit">Se connecter</button>' +
          '<button class="btn btn-ghost" type="button" data-close>Annuler</button></div>' +
        '</form>';
      document.body.appendChild(dlg);
      var form = dlg.querySelector('form'), err = dlg.querySelector('#login-err');
      dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
      dlg.querySelectorAll('[data-demo]').forEach(function (b) {
        b.addEventListener('click', function () {
          var a = B.demoAccounts[Number(b.dataset.demo)];
          form.elements.username.value = a.username;
          form.elements.code.value = a.code;
          err.textContent = '';
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        err.textContent = '';
        var btn = form.querySelector('[type=submit]');
        btn.disabled = true;
        B.login(form.elements.username.value, form.elements.code.value)
          .then(function () { form.reset(); dlg.close(); toast('Connexion réussie.'); })
          .catch(function (x) { err.textContent = x.message; })
          .then(function () { btn.disabled = false; });
      });
    }
    dlg.querySelector('#login-err').textContent = '';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('input[name=username]').focus();
  }

  /* ---------- Vidéo YouTube : lecteur chargé seulement au clic ---------- */
  function openVideo(id, title) {
    if (!/^[\w-]{6,20}$/.test(String(id))) return;
    var dlg = document.getElementById('video-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'video-dialog'; dlg.className = 'video-dialog';
      dlg.innerHTML = '<div class="video-frame"></div><div class="video-bar"><a class="btn btn-ghost btn-sm" data-yt target="_blank" rel="noopener">Ouvrir sur YouTube</a><button class="btn btn-sm" type="button" data-close>Fermer</button></div>';
      document.body.appendChild(dlg);
      var stop = function () { dlg.querySelector('.video-frame').innerHTML = ''; }; /* coupe le son et la lecture */
      dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); stop(); });
      dlg.addEventListener('click', function (ev) { if (ev.target === dlg) { dlg.close(); stop(); } });
      dlg.addEventListener('close', stop);
    }
    dlg.querySelector('[data-yt]').href = 'https://www.youtube.com/watch?v=' + id;
    dlg.querySelector('.video-frame').innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(title || 'Vidéo') + '" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /* ---------- Agrandissement des photos de galerie ---------- */
  function setupLightbox() {
    document.addEventListener('click', function (e) {
      var img = e.target.closest('.masonry .ph img');
      if (!img) return;
      var dlg = document.getElementById('lightbox');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'lightbox'; dlg.className = 'lightbox';
        dlg.innerHTML = '<img alt=""><button class="btn btn-ghost btn-sm" type="button">Fermer</button>';
        document.body.appendChild(dlg);
        dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
      }
      dlg.querySelector('img').src = img.src;
      dlg.querySelector('img').alt = img.alt;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
  }

  /* ---------- Démarrage ---------- */
  renderHeader();
  renderFooter();
  bind();
  setupLightbox();

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-login]')) openLogin();
    var out = e.target.closest('[data-logout]');
    if (out) B.logout().then(function () { toast('Déconnecté.'); });
  });

  var ready = B.init().catch(function (e) { console.error(e); window.CM.initError = e; });
  B.onChange(function () { renderAuth(); window.dispatchEvent(new Event('cm:auth')); });
  ready.then(renderAuth);

  window.CM = {
    C: C, CFG: CFG, esc: esc, get: get, photoFigure: photoFigure, collage: collage, fmtDate: fmtDate, bind: bind,
    animateCounters: animateCounters, toast: toast, openLogin: openLogin, openVideo: openVideo, demoNotice: demoNotice,
    ROLE_LABEL: ROLE_LABEL, ready: ready, initError: null
  };
})();
