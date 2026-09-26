/* ==========================================================================
   PARI Residence — oʻzbekcha (lotin yozuvi). Kalitlar ru.js bilan bir xil;
   faktlar va raqamlar — oʻsha tasdiqlangan maʼlumotlar. Atamalar joriy sayt
   pari-residence.uz/uz bilan bir xil: xonadon, tarh, podyezd, «Zaliniya» mahallasi,
   Goʻroʻgʻli koʻchasi. Oʻnli kasr: 36,84.
   ========================================================================== */
import { home as ruHome, places as ruPlaces, contacts as ruContacts } from './ru.js';

export const refrain = 'Parij nafosati. Samarqand ruhi.';
export const hero = { left: 'Parij nafosati.', right: 'Samarqand ruhi.', script: 'Samarqand' };

export const reasons = {
  arc: 'PARIni tanlash uchun uchta sabab',
  left: 'Samarqand',
  right: 'Zaliniya',
  items: [
    { title: 'Arxitektura', img: 'reasons-arch',
      text: 'Tabiiy tosh va bezak unsurlari bilan ifodali fasadlar, dizaynerlik kirish guruhlari, birinchi qavatlar boʻylab arkadalar.' },
    { title: 'Oʻz bogʻingiz', img: 'reasons-yard',
      text: 'Chinorlar, kashtan va joʻkalar hovlining yashil qiyofasini yaratadi. Bu yerda shoshilmasdan sayr qilish, soyada suhbatlashish va ishlar orasida qisqa tanaffus uchun joy topiladi.' },
    { title: 'Samarqand', img: 'reasons-city',
      text: 'PARI Residence Goʻroʻgʻli koʻchasida joylashgan. Atrof, odatiy yoʻnalishlar va kundalik hayotingizning bir qismiga aylanadigan joylar bilan tanishing.' },
  ],
  note: 'Yevropacha vazminlik. Samarqand iliqligi.',
};

export const arch = {
  quote: 'Shahar ark ortida qoladi.',
  quoteText: 'Oldinda — hovlingiz, koʻkalamzor va oʻzingiz uchun vaqt.',
  creditLabel: 'Arxitektura',
  credit: 'SAFRONOVA PROJECT',
};

export const concept = {
  label: 'PARI xarakteri',
  title: 'Yevropacha vazminlik. Samarqand iliqligi.',
  text: 'PARIda qatʼiy meʼmoriy chiziqlar arkalarning yumshoq shakli va nafis naqsh bilan uygʻunlashadi. Yorugʻlik, tabiiy ranglar va tafsilotlarga eʼtibor uyning tanish qiyofasini yaratadi.',
  country: 'Samarqand',
  place: ['Zaliniya', 'mahallasi'],
  sideTitle: 'Kvartal mahalla bilan birga oʻsadi',
  sideText: 'Kvartal mahalla bilan birga qurilmoqda: yaqinida bogʻ, piyodalar xiyobonlari, yangi maktablar, bolalar bogʻchasi, shahar universiteti va savdo markazi paydo boʻladi.',
  cta: 'Joylashuv bilan tanishish',
  cityTitle: ['Samarqand.', 'Shahardagi oʻrningiz.'],
  cityScript: 'La Ville',
};

export const home = ruHome;
const placeNames = ['Temir yoʻl vokzali', 'Korzinka', 'Universitet', 'Registon', 'Siyob bozori', 'Aeroport'];
export const places = ruPlaces.map((p, i) => ({ ...p, name: placeNames[i] }));

export const masterplan = {
  label: 'Goʻroʻgʻli koʻchasi, Samarqand',
  lines: ['«Zaliniya» mahallasi', 'Oʻzbekiston'],
  drag: 'Koʻrish uchun suring',
};

export const types = [
  { rooms: '1', title: 'Bir xonali', img: 'type-1', from: '36,84', to: '45,34' },
  { rooms: '2', title: 'Ikki xonali', img: 'type-2', from: '41,46', to: '74,03' },
  { rooms: '3', title: 'Uch xonali', img: 'type-3', from: '74,71', to: '95,13' },
];
export const typesText = 'Siz uchun muhim narsadan boshlang: xonalar soni, maydon va qavat. Tarhlarni solishtiring va kuningizni qulay tasavvur qila oladigan xonadonni toping.';
export const typesCta = 'Tarhni koʻrish';

export const statement = {
  head: 'Maydoni 27 dan 95 m² gacha boʻlgan oʻttiz uchta tarh',
  text: 'Ixcham bir xonalidan oilaviy toʻrt xonaligacha.',
};

export const amenities = [
  { name: 'Bogʻ-hovli', img: 'amen-yard',
    head: 'Chinorlar, kashtan va joʻkalar hovlining yashil qiyofasini yaratadi.',
    text: 'Bu yerda shoshilmasdan sayr qilish va ishlar orasida qisqa tanaffus uchun joy topiladi.' },
  { name: 'Sayr', img: 'amen-walk',
    head: 'Uydan shoshilmay chiqish.',
    text: 'Arkalar ostidan oʻtish, yashil hovli yonida toʻxtash va oʻz yoʻlingizni tanlash.' },
  { name: 'Uchrashuvlar', img: 'amen-meet',
    head: 'Suhbat uchun vaqt topish.',
    text: 'Uy yonida qolish va kun sizga tegishli ekanini his qilish.' },
  { name: 'Qaytish', img: 'amen-home',
    head: 'Tanish kirish joyi, yumshoq yorugʻlik va oʻz joyingizda ekanligingiz hissi.',
    text: '' },
];

export const space = {
  title: ['Hayotingiz', 'uchun', 'makon'],
  script: 'Votre espace',
  statement: 'Xonadonlar white-box formatida topshiriladi',
  text: 'Tarhlar shaxsiy va umumiy hududlarni ajratishga imkon beradi, panoramali derazalar esa xonalarni yorugʻlikka toʻldiradi.',
  note: 'Pardozni egasi oʻzi tanlaydi.',
  cta: 'Xonadon tanlash',
  slides: ['live-1', 'live-2', 'live-3', 'live-4', 'live-5'],
};

export const architecture = {
  title: 'Arxitektura',
  lead: 'Yorugʻ fasadlar, ifodali arkalar va derazalar ritmi PARI xarakterini belgilaydi.',
  text: 'Yirik shakllar kvartalga yaxlit siluet beradi, tafsilotlar esa yaqindan — uyga odatiy sayr paytida ochiladi.',
  credits: [['Arxitektura', 'SAFRONOVA PROJECT'], ['Quruvchi', 'FD MARAKANDA']],
  cta: 'Uchrashuvga yozilish',
};

export const team = {
  label: 'PARI ortidagi odamlar va qarorlar.',
  rows: [
    ['Quruvchi', 'FD MARAKANDA'],
    ['Arxitektura', 'SAFRONOVA PROJECT'],
    ['Hamkor bank', 'AGROBANK'],
    ['2029', '1-navbat — 2029-yil III chorak, 2-navbat — 2031-yil II chorak. Qurilish maydonida — kotlovan (2026-yil avgust).'],
  ],
};

export const cta = {
  top: 'PARI Residence bilan tanishishga taklif qilamiz. Loyiha haqida soʻzlab beramiz, tarhlarni koʻrsatamiz va mos variantlarni solishtirishga yordam beramiz.',
  title: ['Samarqand', 'panoramasi'],
  sub: 'Yuqori qavatlardan',
  button: 'Uchrashuvga yozilish',
};

export const contacts = { ...ruContacts, office: 'Savdo boʻlimi', address: 'Samarqand, Goʻroʻgʻli koʻchasi, 6/1', hours: 'Har kuni, 09:00–20:00' };

export const form = {
  script: 'À bientôt',
  title: 'Hayotingizni shu yerda tasavvur qiling.',
  name: 'Ismingiz', namePh: 'Sizga qanday murojaat qilaylik',
  phone: 'Telefon', phonePh: '+998 …',
  consent: 'Murojaatim boʻyicha bogʻlanish uchun shaxsiy maʼlumotlarimni qayta ishlashga roziman',
  submit: 'Uchrashuvga yozilish',
  sending: 'Ariza yuborilmoqda…',
  ok: 'Rahmat! Arizangizni oldik. Menejer uchrashuv vaqtini kelishish uchun siz bilan bogʻlanadi.',
  fail: 'Arizani yuborib boʻlmadi. Qayta urinib koʻring yoki bizga qoʻngʻiroq qiling.',
  nameErr: 'Sizga qanday murojaat qilishni yozing',
  phoneErr: 'Telefon raqamini tekshiring',
  close: 'Yopish',
};

export const meta = {
  home: { title: 'PARI Residence — Samarqanddagi premium-klass turar-joy kvartali',
    description: 'Parij nafosati. Samarqand ruhi. Samarqanddagi premium-klass turar-joy majmuasi: yorugʻ arxitektura, arkalar va yashil hovli.' },
  apartments: { title: 'Xonadon tanlash — PARI Residence, Samarqand',
    description: 'Oʻn uchta podyezdda 1186 ta xonadon: studiyalar, bir, ikki, uch va toʻrt xonali xonadonlar, maydoni 27 dan 95 m² gacha. Xonalar soni va podyezd boʻyicha tarh tanlang.' },
  flat: { title: '{type} xonadon, {area} m² — PARI Residence',
    description: 'PARI Residence, Samarqand: {area} m² maydonli {type} xonadon — tarh, qavat rejasi va podyezd hamda qavatlar boʻyicha shu turdagi xonadonlar.' },
};

export const ui = {
  lang: 'uz', htmlLang: 'uz', locale: 'uz_UZ', name: 'Oʻzbekcha',
  skip: 'Asosiy mazmunga oʻtish',
  langLabel: 'Sayt tili',
  logoLabel: 'PARI Residence — bosh sahifa',
  pick: 'Xonadon tanlash', pickLines: ['Xonadon', 'tanlash'],
  meeting: 'Uchrashuvga yozilish',
  contacts: 'Aloqa',
  menu: 'Menyu', openMenu: 'Menyuni ochish',
  scroll: 'Varaqlang',
  loading: 'Yuklanmoqda',
  home: 'Bosh sahifa',
  toTop: 'Yuqoriga',
  render: 'Loyiha vizualizatsiyasi',
  day: 'Kunduzi', night: 'Kechqurun',
  pins: ['Yorugʻlik va tekstura', 'Fasadlar ritmi', 'Arkalar va galereyalar'],
  prev: 'Oldingi', next: 'Keyingi',
  km: 'km', m2: 'm²',
  distNote: 'Kvartaldan toʻgʻri chiziq boʻyicha masofalar',
  pathLabel: 'Kvartal yaqinida: toʻgʻri chiziq boʻyicha masofalar',
  rooms: 'Xonalar', area: 'Maydon',
  privacy: 'Maxfiylik siyosati',
  route: 'Yoʻnalish olish',
  consentLink: 'rozilik matni',
  lifeLabel: 'Hovli va turmush tarzi',
  alt: {
    hero: 'PARI Residence — birinchi qator fasadi. Loyiha vizualizatsiyasi',
    cutout: 'PARI Residence — kvartalning koʻcha tomondagi fasadi. Loyiha vizualizatsiyasi',
    relief: 'PARI brend barelyefi: gullagan shox',
    zaliniya: '«Zaliniya» mahallasi bosh rejasi: Goʻroʻgʻli koʻchasidagi PARI Residence, yaqinida maktablar, bogʻcha, universitet va savdo markazi. Vizualizatsiya',
    masterplan: 'PARI Residence yuqoridan: hovli atrofidagi binolar. Loyiha vizualizatsiyasi',
    type: '{type} xonadon: interyer. Loyiha vizualizatsiyasi',
    amen: '{name}: PARI Residence loyiha vizualizatsiyasi',
    garden: 'PARI Residence hovlisida travertin va gullar. Loyiha vizualizatsiyasi',
    terrace: 'PARI Residence balkoni. Loyiha vizualizatsiyasi',
    interior: 'PARI Residence xonadoni interyeri. Loyiha vizualizatsiyasi',
    architecture: 'PARI Residence — burchakdagi bino: tosh, latun va derazalar ritmi. Loyiha vizualizatsiyasi',
    cta: 'PARI Residence yuqori qavatlaridan Samarqand panoramasi. Loyiha vizualizatsiyasi',
    plan: 'Tarh: {type}, {area} m²',
    floor: '{floor}-qavat rejasi, {ent}-podyezd',
  },
  place: { rail: 'Temir yoʻl vokzali', korzinka: 'Korzinka', uni: 'Universitet', registan: 'Registon', siab: 'Siyob bozori', airport: 'Aeroport' },
};

export const apts = {
  title: 'Xonadonlar',
  crumb: 'Xonadon tanlash',
  fType: 'Xonalar', fEnt: 'Podyezd', fSort: 'Saralash',
  all: 'Barchasi',
  types: { s: 'Studiya', 1: 'Bir xonali', 2: 'Ikki xonali', 3: 'Uch xonali', 4: 'Toʻrt xonali' },
  sort: { rel: 'Tavsiya etilgan', asc: 'Kichik maydon', desc: 'Katta maydon' },
  reset: 'Tozalash',
  more: 'Yana koʻrsatish',
  empty: 'Bunday xonadonlar yoʻq. Filtrlarni oʻzgartiring yoki tozalang.',
  finish: 'Pardoz: white-box',
  noFmt: '№ {n}', entFmt: '{n}-podyezd', floorFmt: '{n}-qavat',
  roomsShort: { s: 'studiya', 1: '1 xona', 2: '2 xona', 3: '3 xona', 4: '4 xona' },
  same: '+ yana {n} ta shu tarhda',
  benefits: [
    { title: 'Arxitektura', img: 'reasons-arch-800',
      text: 'Tabiiy tosh va bezak unsurlari bilan ifodali fasadlar, dizaynerlik kirish guruhlari, birinchi qavatlar boʻylab arkadalar.' },
    { title: 'Oʻz bogʻingiz', img: 'amen-yard-1280',
      text: 'Chinorlar, kashtan va joʻkalar hovlining yashil qiyofasini yaratadi. Bu yerda shoshilmasdan sayr qilish va qisqa tanaffus uchun joy topiladi.' },
    { title: 'White-box', img: 'live-1-1200',
      text: 'Xonadonlar white-box formatida topshiriladi. Pardozni egasi oʻzi tanlaydi.' },
  ],
};

export const flat = {
  no: '№',
  rooms: 'Xonalar', area: 'Maydon', floor: 'Qavat', ent: 'Podyezd',
  pick: 'Shu tarhdagi xonadonlar',
  count: 'Shu tarhda {n} ta {flats}',
  flatsForms: ['xonadon'],
  tabs: ['Maʼlumot', 'Afzalliklar'],
  info: 'Tarhlar shaxsiy va umumiy hududlarni ajratishga imkon beradi, panoramali derazalar esa xonalarni yorugʻlikka toʻldiradi. Xonadonlar white-box formatida topshiriladi — pardozni egasi oʻzi tanlaydi.',
  benefits: ['Tabiiy toshli ifodali fasadlar', 'Bogʻ-hovli: chinorlar, kashtan va joʻkalar', 'Birinchi qavatlar boʻylab arkadalar', 'Goʻroʻgʻli koʻchasi, «Zaliniya» mahallasi'],
  request: 'Uchrashuvga yozilish',
  plan: 'Tarh',
  floorPlan: 'Qavat rejasi',
  floorNone: 'Bu qavat rejasi hali arxivda yoʻq — menejerdan soʻrang.',
  planNone: 'Bu tarh chizmasi tayyorlanmoqda. Quyida xonadon joylashuvi koʻrsatilgan qavat rejasi.',
  similar: 'Oʻxshash variantlar',
  similarLead: 'Sizga mos kelishi mumkin boʻlgan boshqa xonadonlar',
  all: 'Barchasini koʻrish',
};
