/* ==========================================================================
   PARI Residence — français. Mêmes clés que ru.js ; les faits et chiffres sont
   les mêmes données confirmées (rien n’est ajouté). Les pièces se comptent comme
   en russe (séjour compris) : « 2 pièces » = двухкомнатная. Décimales : 36,84.
   ========================================================================== */
import { home as ruHome, places as ruPlaces, contacts as ruContacts } from './ru.js';

export const refrain = 'Le charme de Paris. L’âme de Samarcande.';
export const hero = { left: 'Le charme de Paris.', right: 'L’âme de Samarcande.', script: 'Samarqand' };

export const reasons = {
  arc: 'Trois raisons de choisir PARI',
  left: 'Samarqand',
  right: 'Zaliniya',
  items: [
    { title: 'Architecture', img: 'reasons-arch',
      text: 'Des façades expressives en pierre naturelle aux éléments décoratifs, des halls d’entrée signés par des designers, des arcades le long des rez-de-chaussée.' },
    { title: 'Un jardin à soi', img: 'reasons-yard',
      text: 'Platanes, marronniers et tilleuls donnent à la cour son caractère verdoyant. On y trouve la place d’une promenade sans hâte, d’une conversation à l’ombre et d’une courte pause entre deux occupations.' },
    { title: 'Samarcande', img: 'reasons-city',
      text: 'PARI Residence se trouve rue Gurugli. Découvrez les environs, les trajets familiers et les lieux qui feront partie de votre quotidien.' },
  ],
  note: 'La retenue européenne. La chaleur de Samarcande.',
};

export const arch = {
  quote: 'La ville reste derrière l’arche.',
  quoteText: 'Devant vous : votre cour, la verdure et du temps pour vous.',
  creditLabel: 'Architecture',
  credit: 'SAFRONOVA PROJECT',
};

export const concept = {
  label: 'Le caractère de PARI',
  title: 'La retenue européenne. La chaleur de Samarcande.',
  text: 'Chez PARI, des lignes architecturales strictes rencontrent la douceur des arches et un ornement délicat. La lumière, les teintes naturelles et le soin du détail composent une image de la maison que l’on reconnaît.',
  country: 'Samarqand',
  place: ['Quartier', 'Zaliniya'],
  sideTitle: 'La résidence grandit avec le quartier',
  sideText: 'La résidence se construit en même temps que le quartier : un parc, des promenades piétonnes, de nouvelles écoles, une crèche, une université et un centre commercial verront le jour à proximité.',
  cta: 'Découvrir l’emplacement',
  cityTitle: ['Samarcande.', 'Votre place dans la ville.'],
  cityScript: 'La Ville',
};

export const home = ruHome;
const placeNames = ['Gare', 'Korzinka', 'Université', 'Registan', 'Bazar Siab', 'Aéroport'];
export const places = ruPlaces.map((p, i) => ({ ...p, name: placeNames[i] }));

export const masterplan = {
  label: 'Rue Gurugli, Samarcande',
  lines: ['Quartier Zaliniya', 'Ouzbékistan'],
  drag: 'Faites glisser pour explorer',
};

export const types = [
  { rooms: '1', title: '1 pièce', img: 'type-1', from: '36,84', to: '45,34' },
  { rooms: '2', title: '2 pièces', img: 'type-2', from: '41,46', to: '74,03' },
  { rooms: '3', title: '3 pièces', img: 'type-3', from: '74,71', to: '95,13' },
];
export const typesText = 'Commencez par ce qui compte pour vous : le nombre de pièces, la surface et l’étage. Comparez les plans et trouvez l’appartement où vous imaginez facilement vos journées.';
export const typesCta = 'Voir les plans';

export const statement = {
  head: 'Trente-trois plans de 27 à 95 m²',
  text: 'Du 1 pièce compact au 4 pièces familial.',
};

export const amenities = [
  { name: 'Cour-jardin', img: 'amen-yard',
    head: 'Platanes, marronniers et tilleuls donnent à la cour son caractère verdoyant.',
    text: 'On y trouve la place d’une promenade sans hâte et d’une courte pause entre deux occupations.' },
  { name: 'Promenade', img: 'amen-walk',
    head: 'Sortir de chez soi sans se presser.',
    text: 'Passer sous les arches, s’attarder près de la cour verdoyante et choisir son chemin.' },
  { name: 'Rencontres', img: 'amen-meet',
    head: 'Prendre le temps d’une conversation.',
    text: 'Rester près de chez soi et sentir que la journée vous appartient.' },
  { name: 'Le retour', img: 'amen-home',
    head: 'Une entrée familière, une lumière douce et le sentiment d’être à sa place.',
    text: '' },
];

export const space = {
  title: ['Un espace', 'pour votre', 'vie'],
  script: 'Votre espace',
  statement: 'Appartements livrés en white-box',
  text: 'Les plans permettent de séparer les espaces privés et communs, et les baies panoramiques inondent les pièces de lumière.',
  note: 'Le propriétaire choisit lui-même les finitions.',
  cta: 'Choisir un appartement',
  slides: ['live-1', 'live-2', 'live-3', 'live-4', 'live-5'],
};

export const architecture = {
  title: 'Architecture',
  lead: 'Des façades claires, des arches expressives et le rythme des fenêtres donnent son caractère à PARI.',
  text: 'Les grands volumes composent une silhouette cohérente, et les détails se révèlent de près — au fil d’une simple promenade vers chez soi.',
  credits: [['Architecture', 'SAFRONOVA PROJECT'], ['Promoteur', 'FD MARAKANDA']],
  cta: 'Prendre rendez-vous',
};

export const team = {
  label: 'Les personnes et les choix derrière PARI.',
  rows: [
    ['Promoteur', 'FD MARAKANDA'],
    ['Architecture', 'SAFRONOVA PROJECT'],
    ['Banque partenaire', 'AGROBANK'],
    ['2029', '1re tranche — 3e trimestre 2029, 2e tranche — 2e trimestre 2031. Sur le chantier : terrassement (août 2026).'],
  ],
};

export const cta = {
  top: 'Nous vous invitons à découvrir PARI Residence. Nous vous présenterons le projet, vous montrerons les plans et vous aiderons à comparer les options qui vous conviennent.',
  title: ['Panorama', 'de Samarcande'],
  sub: 'Depuis les étages supérieurs',
  button: 'Prendre rendez-vous',
};

export const contacts = { ...ruContacts, office: 'Bureau de vente', address: 'Samarcande, 6/1 rue Gurugli', hours: 'Tous les jours, 09:00–20:00' };

export const form = {
  script: 'À bientôt',
  title: 'Imaginez votre vie ici.',
  name: 'Votre nom', namePh: 'Comment vous appeler',
  phone: 'Téléphone', phonePh: '+998 …',
  consent: 'J’accepte le traitement de mes données personnelles afin d’être recontacté au sujet de ma demande',
  submit: 'Prendre rendez-vous',
  sending: 'Envoi de votre demande…',
  ok: 'Merci ! Nous avons bien reçu votre demande. Un conseiller vous contactera pour convenir de l’heure du rendez-vous.',
  fail: 'La demande n’a pas pu être envoyée. Réessayez ou appelez-nous.',
  nameErr: 'Indiquez comment vous appeler',
  phoneErr: 'Vérifiez le numéro de téléphone',
  close: 'Fermer',
};

export const meta = {
  home: { title: 'PARI Residence — résidence haut de gamme à Samarcande',
    description: 'Le charme de Paris. L’âme de Samarcande. Résidence haut de gamme à Samarcande : architecture claire, arches et cour verdoyante.' },
  apartments: { title: 'Choisir un appartement — PARI Residence, Samarcande',
    description: '1 186 appartements dans treize entrées : studios et appartements de 1 à 4 pièces, de 27 à 95 m². Choisissez un plan par nombre de pièces et par entrée.' },
  flat: { title: '{type}, {area} m² — PARI Residence',
    description: '{type} de {area} m² à PARI Residence, Samarcande : plan, plan d’étage et appartements de ce type par entrée et par étage.' },
};

export const ui = {
  lang: 'fr', htmlLang: 'fr', locale: 'fr_FR', name: 'Français',
  skip: 'Aller au contenu',
  langLabel: 'Langue du site',
  logoLabel: 'PARI Residence — accueil',
  pick: 'Choisir un appartement', pickLines: ['Choisir', 'un appartement'],
  meeting: 'Prendre rendez-vous',
  contacts: 'Contact',
  menu: 'Menu', openMenu: 'Ouvrir le menu',
  scroll: 'Défiler',
  loading: 'Chargement',
  home: 'Accueil',
  toTop: 'Haut de page',
  render: 'Visualisation du projet',
  day: 'Jour', night: 'Soir',
  pins: ['Lumière et matière', 'Rythme des façades', 'Arches et galeries'],
  prev: 'Précédent', next: 'Suivant',
  km: 'km', m2: 'm²',
  distNote: 'Distances à vol d’oiseau depuis la résidence',
  pathLabel: 'À proximité : distances à vol d’oiseau',
  rooms: 'Pièces', area: 'Surface',
  privacy: 'Politique de confidentialité',
  route: 'Itinéraire',
  consentLink: 'texte du consentement',
  lifeLabel: 'Cour et art de vivre',
  alt: {
    hero: 'PARI Residence — la façade sur rue. Visualisation du projet',
    cutout: 'PARI Residence — la façade de la résidence côté rue. Visualisation du projet',
    relief: 'Bas-relief signature de PARI : une branche en fleurs',
    zaliniya: 'Plan du quartier Zaliniya : PARI Residence rue Gurugli, avec écoles, crèche, université et centre commercial à proximité. Visualisation',
    masterplan: 'PARI Residence vue du ciel : les bâtiments autour de la cour. Visualisation du projet',
    type: 'Appartement {type} : intérieur. Visualisation du projet',
    amen: '{name} : visualisation du projet PARI Residence',
    garden: 'Travertin et fleurs dans la cour de PARI Residence. Visualisation du projet',
    terrace: 'Un balcon de PARI Residence. Visualisation du projet',
    interior: 'Intérieur d’un appartement PARI Residence. Visualisation du projet',
    architecture: 'PARI Residence — le bâtiment d’angle : pierre, laiton et rythme des fenêtres. Visualisation du projet',
    cta: 'Panorama de Samarcande depuis les étages supérieurs de PARI Residence. Visualisation du projet',
    plan: 'Plan : {type}, {area} m²',
    floor: 'Plan du {floor}e étage, entrée {ent}',
  },
  place: { rail: 'Gare', korzinka: 'Korzinka', uni: 'Université', registan: 'Registan', siab: 'Bazar Siab', airport: 'Aéroport' },
};

export const apts = {
  title: 'Appartements',
  crumb: 'Choisir un appartement',
  fType: 'Pièces', fEnt: 'Entrée', fSort: 'Trier',
  all: 'Tous',
  types: { s: 'Studio', 1: '1 pièce', 2: '2 pièces', 3: '3 pièces', 4: '4 pièces' },
  sort: { rel: 'Recommandés', asc: 'Surface croissante', desc: 'Surface décroissante' },
  reset: 'Réinitialiser',
  more: 'Afficher plus',
  empty: 'Aucun appartement ne correspond. Modifiez ou réinitialisez les filtres.',
  finish: 'Finition : white-box',
  noFmt: 'N° {n}', entFmt: 'Entrée {n}', floorFmt: '{n}e étage',
  roomsShort: { s: 'studio', 1: '1 p.', 2: '2 p.', 3: '3 p.', 4: '4 p.' },
  same: '+ {n} autres de ce plan',
  benefits: [
    { title: 'Architecture', img: 'reasons-arch-800',
      text: 'Des façades expressives en pierre naturelle aux éléments décoratifs, des halls d’entrée signés par des designers, des arcades le long des rez-de-chaussée.' },
    { title: 'Un jardin à soi', img: 'amen-yard-1280',
      text: 'Platanes, marronniers et tilleuls donnent à la cour son caractère verdoyant. On y trouve la place d’une promenade sans hâte et d’une courte pause.' },
    { title: 'White-box', img: 'live-1-1200',
      text: 'Appartements livrés en white-box. Le propriétaire choisit lui-même les finitions.' },
  ],
};

export const flat = {
  no: 'N°',
  rooms: 'Pièces', area: 'Surface', floor: 'Étage', ent: 'Entrée',
  pick: 'Appartements de ce plan',
  count: '{n} {flats} de ce plan',
  flatsForms: ['appartement', 'appartements'],
  tabs: ['Infos', 'Atouts'],
  info: 'Les plans permettent de séparer les espaces privés et communs, et les baies panoramiques inondent les pièces de lumière. Appartements livrés en white-box — le propriétaire choisit lui-même les finitions.',
  benefits: ['Façades expressives en pierre naturelle', 'Cour-jardin : platanes, marronniers et tilleuls', 'Arcades le long des rez-de-chaussée', 'Rue Gurugli, quartier Zaliniya'],
  request: 'Prendre rendez-vous',
  plan: 'Plan',
  floorPlan: 'Plan d’étage',
  floorNone: 'Le plan de cet étage n’est pas encore dans les archives — renseignez-vous auprès d’un conseiller.',
  planNone: 'Le plan de cet appartement est en préparation. Ci-dessous, le plan d’étage avec l’emplacement de l’appartement.',
  similar: 'Options similaires',
  similarLead: 'D’autres appartements qui pourraient vous convenir',
  all: 'Tout voir',
};
