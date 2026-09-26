/* ==========================================================================
   PARI Residence — English. Same keys as ru.js; facts and figures are the
   same confirmed ones (nothing added). Latin calligraphy accents stay as in RU.
   Numbers: decimal point (36.84), m².
   ========================================================================== */
import { home as ruHome, places as ruPlaces, contacts as ruContacts } from './ru.js';

export const refrain = 'Parisian charm. Samarkand soul.';
export const hero = { left: 'Parisian charm.', right: 'Samarkand soul.', script: 'Samarqand' };

export const reasons = {
  arc: 'Three reasons to choose PARI',
  left: 'Samarqand',
  right: 'Zaliniya',
  items: [
    { title: 'Architecture', img: 'reasons-arch',
      text: 'Expressive façades with natural stone and decorative details, designer entrance halls and arcades along the ground floors.' },
    { title: 'A garden of your own', img: 'reasons-yard',
      text: 'Plane trees, chestnuts and lindens give the courtyard its green character. There is room for an unhurried walk, a conversation in the shade and a short pause between errands.' },
    { title: 'Samarkand', img: 'reasons-city',
      text: 'PARI Residence stands on Gurugli Street. Explore the neighbourhood, everyday routes and the places that will become part of your daily life.' },
  ],
  note: 'European restraint. Samarkand warmth.',
};

export const arch = {
  quote: 'The city stays beyond the arch.',
  quoteText: 'Ahead are your courtyard, greenery and time for yourself.',
  creditLabel: 'Architecture',
  credit: 'SAFRONOVA PROJECT',
};

export const concept = {
  label: 'The character of PARI',
  title: 'European restraint. Samarkand warmth.',
  text: 'At PARI, strict architectural lines meet the soft curves of arches and delicate ornament. Light, natural tones and attention to detail come together in a recognisable image of home.',
  country: 'Samarqand',
  place: ['Zaliniya', 'district'],
  sideTitle: 'The quarter grows with the district',
  sideText: 'The quarter is being built together with the district: a park, pedestrian boulevards, new schools, a kindergarten, a city university and a shopping centre will appear nearby.',
  cta: 'Explore the location',
  cityTitle: ['Samarkand.', 'Your place in the city.'],
  cityScript: 'La Ville',
};

export const home = ruHome;
const placeNames = ['Railway station', 'Korzinka', 'University', 'Registan', 'Siab Bazaar', 'Airport'];
export const places = ruPlaces.map((p, i) => ({ ...p, name: placeNames[i] }));

export const masterplan = {
  label: 'Gurugli Street, Samarkand',
  lines: ['Zaliniya district', 'Uzbekistan'],
  drag: 'Drag to explore',
};

export const types = [
  { rooms: '1', title: '1-room', img: 'type-1', from: '36.84', to: '45.34' },
  { rooms: '2', title: '2-room', img: 'type-2', from: '41.46', to: '74.03' },
  { rooms: '3', title: '3-room', img: 'type-3', from: '74.71', to: '95.13' },
];
export const typesText = 'Start with what matters to you: the number of rooms, the area and the floor. Compare the layouts and find the apartment where you can easily picture your day.';
export const typesCta = 'View layouts';

export const statement = {
  head: 'Thirty-three layouts from 27 to 95 m²',
  text: 'From a compact one-room apartment to a four-room family home.',
};

export const amenities = [
  { name: 'Garden courtyard', img: 'amen-yard',
    head: 'Plane trees, chestnuts and lindens give the courtyard its green character.',
    text: 'There is room for an unhurried walk and a short pause between errands.' },
  { name: 'Walks', img: 'amen-walk',
    head: 'Leave home without hurrying.',
    text: 'Walk beneath the arches, linger by the green courtyard and choose your own route.' },
  { name: 'Meetings', img: 'amen-meet',
    head: 'Find time for a conversation.',
    text: 'Stay close to home and feel that the day belongs to you.' },
  { name: 'Coming home', img: 'amen-home',
    head: 'A familiar entrance, soft light and the feeling that you are where you belong.',
    text: '' },
];

export const space = {
  title: ['Space', 'for your', 'life'],
  script: 'Votre espace',
  statement: 'Apartments are delivered white-box',
  text: 'The layouts let you separate private and shared areas, while panoramic windows fill the rooms with light.',
  note: 'The owner chooses the finishes.',
  cta: 'Select an apartment',
  slides: ['live-1', 'live-2', 'live-3', 'live-4', 'live-5'],
};

export const architecture = {
  title: 'Architecture',
  lead: 'Light façades, expressive arches and the rhythm of the windows define the character of PARI.',
  text: 'Large volumes give the quarter a coherent silhouette, while the details reveal themselves up close — on an ordinary walk home.',
  credits: [['Architecture', 'SAFRONOVA PROJECT'], ['Developer', 'FD MARAKANDA']],
  cta: 'Book a meeting',
};

export const team = {
  label: 'The people and decisions behind PARI.',
  rows: [
    ['Developer', 'FD MARAKANDA'],
    ['Architecture', 'SAFRONOVA PROJECT'],
    ['Partner bank', 'AGROBANK'],
    ['2029', 'Phase 1 — Q3 2029, phase 2 — Q2 2031. On site: excavation (August 2026).'],
  ],
};

export const cta = {
  top: 'We invite you to get to know PARI Residence. We will tell you about the project, show you the layouts and help you compare the options that suit you.',
  title: ['Panorama', 'of Samarkand'],
  sub: 'From the upper floors',
  button: 'Book a meeting',
};

export const contacts = { ...ruContacts, office: 'Sales office', address: 'Samarkand, 6/1 Gurugli Street', hours: 'Daily, 09:00–20:00' };

export const form = {
  script: 'À bientôt',
  title: 'Picture your life here.',
  name: 'Your name', namePh: 'How should we address you',
  phone: 'Phone', phonePh: '+998 …',
  consent: 'I agree to the processing of my personal data so that you can contact me about my request',
  submit: 'Book a meeting',
  sending: 'Sending your request…',
  ok: 'Thank you! We have received your request. A manager will contact you to arrange a time for the meeting.',
  fail: 'We could not send your request. Please try again or call us.',
  nameErr: 'Please tell us how to address you',
  phoneErr: 'Please check the phone number',
  close: 'Close',
};

export const meta = {
  home: { title: 'PARI Residence — a premium residential quarter in Samarkand',
    description: 'Parisian charm. Samarkand soul. A premium residential complex in Samarkand: light architecture, arches and a green courtyard.' },
  apartments: { title: 'Select an apartment — PARI Residence, Samarkand',
    description: '1,186 apartments in thirteen entrances: studios and one- to four-room apartments from 27 to 95 m². Choose a layout by rooms and entrance.' },
  flat: { title: '{type} apartment, {area} m² — PARI Residence',
    description: '{type} apartment of {area} m² at PARI Residence, Samarkand: layout, floor plan and apartments of this type by entrance and floor.' },
};

export const ui = {
  lang: 'en', htmlLang: 'en', locale: 'en_US', name: 'English',
  skip: 'Skip to content',
  langLabel: 'Site language',
  logoLabel: 'PARI Residence — home',
  pick: 'Select an apartment', pickLines: ['Select', 'an apartment'],
  meeting: 'Book a meeting',
  contacts: 'Contact',
  menu: 'Menu', openMenu: 'Open menu',
  scroll: 'Scroll',
  loading: 'Loading',
  home: 'Home',
  toTop: 'To top',
  render: 'Project visualisation',
  day: 'Day', night: 'Evening',
  pins: ['Light and texture', 'Façade rhythm', 'Arches and galleries'],
  prev: 'Previous', next: 'Next',
  km: 'km', m2: 'm²',
  distNote: 'Straight-line distances from the quarter',
  pathLabel: 'Nearby: straight-line distances from the quarter',
  rooms: 'Rooms', area: 'Area',
  privacy: 'Privacy policy',
  route: 'Get directions',
  consentLink: 'consent text',
  lifeLabel: 'Courtyard and lifestyle',
  alt: {
    hero: 'PARI Residence — the front façade. Project visualisation',
    cutout: 'PARI Residence — the street façade of the quarter. Project visualisation',
    relief: 'PARI signature bas-relief: a blossoming branch',
    zaliniya: 'Zaliniya district master plan: PARI Residence on Gurugli Street, with schools, a kindergarten, a university and a shopping centre nearby. Visualisation',
    masterplan: 'PARI Residence from above: buildings around the courtyard. Project visualisation',
    type: '{type} apartment: interior. Project visualisation',
    amen: '{name}: PARI Residence project visualisation',
    garden: 'Travertine and flowers in the PARI Residence courtyard. Project visualisation',
    terrace: 'A PARI Residence balcony. Project visualisation',
    interior: 'A PARI Residence apartment interior. Project visualisation',
    architecture: 'PARI Residence — the corner building: stone, brass and the rhythm of windows. Project visualisation',
    cta: 'Panorama of Samarkand from the upper floors of PARI Residence. Project visualisation',
    plan: 'Layout: {type}, {area} m²',
    floor: 'Floor {floor} plan, entrance {ent}',
  },
  place: { rail: 'Railway station', korzinka: 'Korzinka', uni: 'University', registan: 'Registan', siab: 'Siab Bazaar', airport: 'Airport' },
};

export const apts = {
  title: 'Apartments',
  crumb: 'Select an apartment',
  fType: 'Rooms', fEnt: 'Entrance', fSort: 'Sort by',
  all: 'All',
  types: { s: 'Studio', 1: '1-room', 2: '2-room', 3: '3-room', 4: '4-room' },
  sort: { rel: 'Recommended', asc: 'Smallest area', desc: 'Largest area' },
  reset: 'Reset',
  more: 'Show more',
  empty: 'No apartments match. Change or reset the filters.',
  finish: 'Finish: white-box',
  noFmt: 'No. {n}', entFmt: 'Entrance {n}', floorFmt: 'Floor {n}',
  roomsShort: { s: 'studio', 1: '1 room', 2: '2 rooms', 3: '3 rooms', 4: '4 rooms' },
  same: '+ {n} more with this layout',
  benefits: [
    { title: 'Architecture', img: 'reasons-arch-800',
      text: 'Expressive façades with natural stone and decorative details, designer entrance halls and arcades along the ground floors.' },
    { title: 'A garden of your own', img: 'amen-yard-1280',
      text: 'Plane trees, chestnuts and lindens give the courtyard its green character. There is room for an unhurried walk and a short pause between errands.' },
    { title: 'White-box', img: 'live-1-1200',
      text: 'Apartments are delivered white-box. The owner chooses the finishes.' },
  ],
};

export const flat = {
  no: 'No.',
  rooms: 'Rooms', area: 'Area', floor: 'Floor', ent: 'Entrance',
  pick: 'Apartments with this layout',
  count: '{n} {flats} with this layout',
  flatsForms: ['apartment', 'apartments'],
  tabs: ['Info', 'Benefits'],
  info: 'The layouts let you separate private and shared areas, while panoramic windows fill the rooms with light. Apartments are delivered white-box — the owner chooses the finishes.',
  benefits: ['Expressive façades with natural stone', 'Garden courtyard: plane trees, chestnuts and lindens', 'Arcades along the ground floors', 'Gurugli Street, Zaliniya district'],
  request: 'Book a meeting',
  plan: 'Layout',
  floorPlan: 'Floor plan',
  floorNone: 'This floor plan is not in the archive yet — please ask a manager.',
  planNone: 'The drawing of this layout is being prepared. Below is the floor plan showing where the apartment is.',
  similar: 'Similar options',
  similarLead: 'Other apartments that might suit you',
  all: 'View all',
};
