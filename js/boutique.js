/* Page Boutique : vitrine des produits + lien vers la boutique en ligne (Shopify, HelloAsso...). */
(function () {
  'use strict';
  var CM = window.CM, S = CM.C.shop, esc = CM.esc;
  var shopUrl = String(S.url || '').trim();
  if (shopUrl && !/^https?:\/\//i.test(shopUrl)) shopUrl = '';

  var cta = document.getElementById('shop-cta');
  var note = document.getElementById('shop-note');
  if (shopUrl) {
    cta.innerHTML = '<a class="btn" href="' + esc(shopUrl) + '" target="_blank" rel="noopener">' + esc(S.buttonLabel || 'Accéder à la boutique') + '</a>';
  } else {
    note.innerHTML = '<div class="notice shop-note"><strong>La boutique en ligne ouvre bientôt.</strong> En attendant, tu peux déjà découvrir les articles prévus.</div>';
  }

  document.getElementById('shop-root').innerHTML = (S.items || []).map(function (it) {
    var url = String(it.url || shopUrl || '').trim();
    if (url && !/^https?:\/\//i.test(url)) url = '';
    var btn = url
      ? '<a class="btn btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">Commander</a>'
      : '<span class="btn btn-sm" aria-disabled="true">Bientôt disponible</span>';
    return '<article class="card product">' + CM.photoFigure(it.photo, { ratio: '1 / 1' }) +
      '<div class="card-body"><h3>' + esc(it.name) + '</h3>' +
      (it.price ? '<p class="price">' + esc(it.price) + '</p>' : '') +
      '<p>' + esc(it.text || '') + '</p>' + btn + '</div></article>';
  }).join('');
})();
