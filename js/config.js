/* ==========================================================================
   Réglages du site. Seul fichier à modifier pour changer le fonctionnement.
   ========================================================================== */
window.SITE_CONFIG = {
  siteName: "Croquette & Macadam",

  // "demo"     : les données (comptes, calendrier, photos, fiches) sont stockées
  //              uniquement dans le navigateur de la personne. Sert à tester le site.
  //              NE PAS utiliser en production : rien n'est partagé ni sécurisé.
  // "supabase" : vraie base de données partagée et sécurisée (voir README.md).
  mode: "demo",

  // Remplis ces trois lignes quand tu passes en mode "supabase"
  supabaseUrl: "",
  supabaseAnonKey: "",
  // Les identifiants (ex. "marie") sont transformés en adresse fictive
  // marie@asso.local : aucun vrai e-mail n'est demandé aux bénévoles.
  fakeEmailDomain: "asso.local",
  photoBucket: "maraudes",

  // Formulaire de contact
  // Option 1 (recommandée) : un service comme Formspree ou Web3Forms.
  //   Colle ici l'adresse fournie, ex. "https://formspree.io/f/xxxxxxx".
  //   Les messages arrivent alors directement dans la boîte mail de l'asso.
  contactEndpoint: "https://formspree.io/f/xpppjdyz",
  // Option 2 (secours) : ouvre le logiciel de mail du visiteur avec le message prérempli.
  contactEmail: "A_REMPLACER@exemple.fr",

  helloassoUrl: "https://www.helloasso.com/associations/croquette-macadam",
  instagramUrl: "https://www.instagram.com/croquette.et.macadam/"
};
