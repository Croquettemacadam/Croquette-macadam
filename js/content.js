/* ==========================================================================
   Contenu du site : TOUS les textes, chiffres et chemins de photos sont ici.
   Pour modifier le site sur GitHub : ouvre ce fichier, clique sur le crayon,
   modifie, puis "Commit changes". Le site se met à jour tout seul en 1 à 2 minutes.

   RÈGLES SIMPLES
   - Ne modifie que le texte ENTRE LES GUILLEMETS. Garde les guillemets, les virgules et les { }.
   - Les photos se déposent dans le dossier assets/img/ puis se référencent ici.
   - Si une photo est introuvable, un cadre "Photo à ajouter" s'affiche à la place.
   - Tous les textes ci-dessous sont des exemples à réécrire.

   OPTIONS D'UNE PHOTO (toutes facultatives, sauf src)
     src      "assets/img/nom.jpg"      le fichier
     alt      "Description"             texte pour l'accessibilité
     shape    "rounded" | "arch" | "circle" | "blob" | "polaroid" | "square"
                                        forme du cadre (rounded par défaut)
     ratio    "4 / 3", "1 / 1", "3 / 4", "16 / 9"...   proportions du cadre (largeur / hauteur)
     focus    "50% 20%"                 partie de la photo à garder (gauche-droite, haut-bas)
     caption  "Texte"                   légende (surtout pour le style polaroid)
     credit   "Photo par Prénom Nom"    crédit affiché sous les photos de la section (Mission, Impact)
   OPTIONS SUPPLÉMENTAIRES POUR UN COLLAGE (sections Mission et Impact)
     x, y     0 à 100                   position du coin haut-gauche, en % du cadre du collage
     w        10 à 100                  largeur de la photo, en % du cadre du collage
     rotate   -10 à 10                  inclinaison en degrés
     z        1, 2, 3...                la photo avec le plus grand z passe devant
   "photosRatio" règle les proportions du cadre du collage ("1 / 1" = carré, "4 / 3" = plus large que haut).
   Astuce : change les chiffres, enregistre, et regarde le résultat. Rien ne peut se casser.
   ========================================================================== */
window.SITE_CONTENT = {

  hero: {
    // Photo de fond du tout premier bloc : dépose "hero.jpg" dans assets/img/
    // (photo large, 1920 px de large, moins de 500 Ko). Sans fichier, un fond clair s'affiche.
    background: "assets/img/hero.jpg",
    kicker: "Association bordelaise, active depuis 2018",
    title: "Des croquettes, du matériel et des soins pour les compagnons des personnes en grande précarité",
    text: "À Bordeaux, nous aidons les personnes sans domicile à prendre soin de leur animal : nourriture, équipement, accès au vétérinaire."
  },

  mission: {
    kicker: "Notre mission",
    title: "Un animal à la rue, c'est un lien qui compte",
    paragraphs: [
      "Pour beaucoup de personnes sans domicile, leur animal est une présence de tous les jours, un soutien et parfois une protection.",
      "Quand l'argent manque, il faut pourtant choisir entre se nourrir ou se soigner soi-même et nourrir ou soigner son compagnon. Nous voulons que ce choix n'ait pas à être fait.",
      "En aidant les animaux, nous préservons aussi la dignité et le lien social de leurs maîtres."
    ],
    // Vidéo YouTube : miniature sous le texte, lecture en grand au clic.
    // "id" = la partie après v= dans l'adresse YouTube. Mets id: "" pour retirer la vidéo.
    video: {
      id: "zE7rdhe7fOs",
      title: "Découvrir Croquette & Macadam en vidéo",
      credit: "Vidéo par Suzanne Ketfi"
    },
    photosRatio: "1 / 1",
    photos: [
      { src: "assets/img/mission-1.jpg", alt: "Première image de présentation", shape: "arch", x: 0, y: 0, w: 60, ratio: "4 / 5", rotate: -2, z: 1 },
      { src: "assets/img/mission-2.jpg", alt: "Deuxième image de présentation", shape: "circle", x: 42, y: 42, w: 58, ratio: "1 / 1", focus: "50% 70%", rotate: 0, z: 2, 
      credit: "Photos par Pauline Gobin"
      }
    ]
  },

  actions: {
    kicker: "Nos actions",
    title: "Ce que nous faisons sur le terrain",
    intro: "Quatre façons concrètes d'agir, toute l'année.",
    items: [
      {
        title: "Maraudes du dimanche",
        text: "Chaque semaine, nos bénévoles vont à la rencontre des personnes accompagnées d'un animal pour distribuer croquettes et matériel.",
        photo: { src: "assets/img/actions-1.jpg", alt: "Présentations d'une maraude", shape: "rounded", ratio: "4 / 3", focus: "50% 80%" }
      },
      {
        title: "Soins vétérinaires",
        text: "Grâce à des vétérinaires partenaires, nous participons aux frais de consultation et de soins en cas de besoin ou d'urgence.",
        photo: { src: "assets/img/actions-2.jpg", alt: "Présentation des soins vétérinaires", shape: "rounded", ratio: "4 / 3" }
      },
      {
        title: "Accompagnement en cas de séparation",
        text: "Quand garder l'animal n'est plus possible, nous aidons à trouver un placement ou une adoption, au plus près de l'intérêt de chacun.",
        photo: { src: "assets/img/actions-3.jpg", alt: "Présentation des accompagnements", shape: "rounded", ratio: "4 / 3", focus: "50% 40%" }
      },
      {
        title: "Collectes et sensibilisation",
        text: "Collectes de matériel, événements solidaires et interventions auprès des scolaires pour changer le regard sur la vie à la rue.",
        photo: { src: "assets/img/actions-4.jpg", alt: "Présenation des événements", shape: "rounded", ratio: "4 / 3" }
      }
    ]
  },

  impact: {
    kicker: "Notre impact",
    title: "Notre impact en 2025",
    intro: "Quelques chiffres pour mesurer ce que votre soutien rend possible.",
    counters: [
      { value: 40, label: "bénéficiaires et animaux suivis" },
      { value: 15, label: "bénévoles" },
      { value: 50, label: "maraudes organisées" },
      { value: 1500, label: "kg de croquettes et friandises distribués" },
      { value: 3, label: "événements et collectes" }
    ],
    donation: "40 € permettent d'acheter 20 kg de croquettes. 60 € peuvent contribuer à une consultation vétérinaire.",
    photosRatio: "10 / 8",
    photos: [
      { src: "assets/img/impact-1.jpg", alt: "Phot d'illustration de l'utilité des dons", shape: "polaroid", x: 8, y: 4, w: 84, ratio: "4 / 3", rotate: 3, caption: "Une gamelle pour tous" }
    ]
  },

  contact: {
    kicker: "Contact",
    title: "Une question, une envie d'aider ?",
    intro: "Particulier, entreprise ou futur bénévole : écrivez-nous, nous vous répondrons dès que possible."
  },

  /* ---------- Page Boutique ----------
     url : adresse de ta boutique en ligne (Shopify, HelloAsso, autre). Tant qu'elle est vide,
     la page affiche "bientôt disponible" et les boutons sont désactivés.
     Chaque produit peut avoir sa propre adresse (url), sinon c'est l'adresse de la boutique. */
  shop: {
    // true = la boutique est visible (menu + page). false = en attente : le lien disparaît du menu
    // et la page affiche seulement "boutique non disponible". Pour la rouvrir, remets true.
    visible: false,
    title: "La boutique solidaire",
    intro: "Chaque achat finance les croquettes, le matériel et les soins vétérinaires des compagnons que nous accompagnons.",
    url: "",
    buttonLabel: "Accéder à la boutique en ligne",
    items: [
      { name: "Tee-shirt (exemple)", price: "Prix à définir", text: "Description du produit : matière, tailles, couleurs.", photo: { src: "assets/img/boutique-1.jpg", alt: "Photo produit en vente", ratio: "1 / 1" } },
      { name: "Bijou (exemple)", price: "Prix à définir", text: "Description du produit : fait main, matière, taille.", photo: { src: "assets/img/boutique-2.jpg", alt: "Photo produit en vente", ratio: "1 / 1" } },
      { name: "Tote bag (exemple)", price: "Prix à définir", text: "Description du produit.", photo: { src: "assets/img/boutique-3.jpg", alt: "Photo produit en vente", ratio: "1 / 1" } }
    ]
  },

  /* ---------- Page Maraudes ----------
     Entrées ajoutées à la main (via GitHub). Les maraudes publiées par la
     photographe depuis le site s'affichent en plus, automatiquement.
     Date au format AAAA-MM-JJ. Les photos s'affichent en galerie libre (chaque photo garde ses proportions). */
  maraudes: {
    title: "Retour sur nos maraudes",
    intro: "Chaque dimanche, nous allons à la rencontre des personnes et de leurs compagnons. Voici quelques images de nos sorties.",
    entries: [
      {
        date: "2026-09-27",
        title: "Maraude hebdomadaire",
        text: "Nous y avons rencontrés X bénéficiaires et leurs X compagnons, à qui nous avons distribué : résultats de la maraude.",
        photos: [
          { src: "assets/img/maraude-2026-10-11-1.jpg", alt: "Maraude du 27 septembre" },
          { src: "assets/img/maraude-2026-10-11-2.jpg", alt: "Maraude du 27 septembre" }
        ]
      }
    ]
  },

  /* ---------- Page Bénévoles ---------- */
  benevoles: {
    title: "Les bénévoles",
    intro: "Croquette & Macadam fonctionne grâce à celles et ceux qui donnent de leur temps. Voici l'équipe.",
    team: [
      { name: "Frederic Prieto", role: "Président", text: "Fondateur et pillier de l'association. Frederic connaît mieux que personne la vie de nos bénéficiaires.", photo: { src: "assets/img/equipe-1.jpg", alt: "Portrait du président", shape: "circle", ratio: "1 / 1", focus: "50% 30%" } },
      { name: "Pauline Gobin", role: "Photographe", text: "Pauline sait mettre en valeurs tous les compagnons. Ses photos apportent de la joie aux bénéficiaires et aux bénévoles.", photo: { src: "assets/img/equipe-2.jpg", alt: "Portrait de la photographe", shape: "circle", ratio: "1 / 1", focus: "50% 30%" } },
      { name: "Prénom Nom", role: "Bénévole", text: "Petit texte de présentation (à compléter).", photo: { src: "assets/img/equipe-3.jpg", alt: "Portrait du/de la bénévole", shape: "circle", ratio: "1 / 1", focus: "50% 30%" } }
    ],
    eventsTitle: "Où nous retrouver",
    eventsIntro: "Forums des associations, collectes, événements solidaires : venez nous rencontrer.",
    events: [
      {
        date: "17 octobre 2026",
        title: "Fête des citernes",
        place: "Bordeaux Sud",
        text: "Fête de quartier et forum des association.",
        photo: { src: "assets/img/forum-1.jpg", alt: "Stand de l'association", ratio: "16 / 10" }
      }
    ],
    espaceTitle: "Espace bénévoles",
    espaceIntro: "Connecte-toi avec l'identifiant et le code remis par le bureau pour t'inscrire aux maraudes et aux événements."
  },

  /* ---------- Informations légales (pied de page) ----------
     À compléter avec les vraies informations. Fais relire ces textes par le bureau. */
  legal: {
    name: "Croquette & Macadam",
    form: "Association loi 1901",
    address: "Siège social : 7 Imp. Saint-jean, Bordeaux",
    email: "A_REMPLACER@exemple.fr",
    publicationDirector: "Frederic Prieto",
    rna: "W000000000 (à compléter)",
    siret: "à compléter",
     credit: "crédit photo : Pauline Gobin",
    host: "Site hébergé par GitHub Pages.",
    privacy: [
      "Les informations saisies dans le formulaire de contact (nom, prénom, adresse e-mail, téléphone, message) sont utilisées uniquement pour répondre à votre demande. Elles ne sont ni vendues ni transmises à des tiers.",
      "Elles sont conservées le temps nécessaire au traitement de votre demande, puis supprimées (durée à préciser).",
      "Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à l'adresse de contact ci-dessus.",
      "Les comptes bénévoles contiennent un identifiant et un prénom. Les fiches des animaux et de leurs maîtres sont visibles en lecture par les bénévoles connectés et ne peuvent être modifiées que par la présidence.",
      "La vidéo de présentation est hébergée par YouTube (mode confidentialité renforcée) : le lecteur ne se charge qu'au clic, mais l'image d'aperçu est fournie par YouTube. La boutique, si elle est ouverte, est gérée par un service tiers avec ses propres conditions."
    ]
  }
};
