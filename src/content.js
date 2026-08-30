/* ==========================================================================
   PARI Residence — контент сайта. Единственный источник текстов и данных:
   отсюда собираются русская и узбекская версии всех страниц (build.js).

   Правило: сюда попадают только подтверждённые данные. Всё, что не подтверждено
   владельцем, помечено TODO и на сайт не выводится.
   ========================================================================== */

'use strict';

/* Адрес сайта. Домен подключён 30.08.2026: A-запись корня и CNAME для www
   стоят в DNS UZCLOUD. Основным выбран короткий адрес без www — он идёт на
   печать и в наружную рекламу; www переадресовывается на него (308).
   Здесь указан ровно тот адрес, которым сайт отвечает в конце цепочки:
   canonical, карта сайта и og:url обязаны совпадать с ним, иначе поисковик
   считает основным другой хост. Переменная SITE_ORIGIN перебивает значение. */
const ORIGIN = process.env.SITE_ORIGIN || 'https://pari-residence.uz';

const site = {
  origin: ORIGIN,
  brand: 'PARI Residence',
  phone: { display: '55 705 05 05', tel: '+998557050505', intl: '+998 55 705 05 05' },
  address: {
    street: 'улица Гуругли, 1',
    streetUz: 'Goʻroʻgʻli koʻchasi, 1',
    city: 'Самарканд',
    cityUz: 'Samarqand',
    country: 'UZ',
  },
  geo: { lat: 39.685917, lon: 66.94061 },        // офис продаж, подтверждено владельцем
  hours: {
    // Подтверждено владельцем 19.08.2026: ежедневно 09:00–20:00.
    ru: 'Ежедневно с 9:00 до 20:00',
    uz: 'Har kuni 9:00 dan 20:00 gacha',
    schema: 'Mo-Su 09:00-20:00',
    confirmed: true,
  },
  // Подтверждено владельцем 26.08.2026: 10 млн сум — за квадратный метр,
  // цена указана без учёта скидок.
  price: { from: 10, unit: 'млн сум', unitUz: 'mln soʻm', perSqm: true, confirmed: true },
  // Банк-партнёр, подтверждён владельцем 26.08.2026.
  bank: { name: 'AGROBANK', confirmed: true },
  /* Стадия стройки быстро устаревает, поэтому рядом всегда показываем месяц,
     на который она подтверждена. Обновлять здесь — цифра сама попадёт на сайт. */
  build: { stage: 'Котлован', stageUz: 'Kotlovan', asOf: 'август 2026', asOfUz: '2026-yil avgust' },
  instagram: 'https://www.instagram.com/pari_residence/',
  // Подтверждено владельцем 26.08.2026. WhatsApp у отдела продаж нет.
  telegram: 'https://t.me/pari_residence',
  // Заставка при первом заходе (медальон, уезжающий вверх). Выключается одной строкой:
  // splash: false — и разметка со скриптом на страницу не попадут.
  splash: false,
  /* Площади уточнены по финальному буклету (27,21 м² — самая маленькая
     однокомнатная, 95,13 м² — самая большая трёхкомнатная). До 27.08.2026 на
     сайте стояло «26–89 м²» — цифры из более раннего рабочего файла. */
  facts: { blocks: 13, apartments: 1202, green: 30, yardHa: 1, areaFrom: 27, areaTo: 95 },

  // Архитектурное бюро проекта, подтверждено буклетом (раздел 03).
  architect: { name: 'SAFRONOVA PROJECT', confirmed: true },

  /* Подтверждено владельцем 26.08.2026: застройщик, деление на очереди,
     сроки сдачи и условия рассрочки. Срок рассрочки привязан к сдаче первой
     очереди, поэтому со временем он сокращается — считается при сборке. */
  developer: { name: 'FD MARAKANDA', confirmed: true },
  stages: [
    { no: 1, blocks: 6, quarter: 3, year: 2029 },
    { no: 2, blocks: 7, quarter: 2, year: 2031 },
  ],
  instalment: { rate: 0, maxMonths: 36, untilStage: 1, confirmed: true },

  /* Счётчики. Ресурс Google Аналитики заведён 30.08.2026 на pari-residence.uz
     (аккаунт «PARI Residence», часовой пояс Ташкент, валюта сум). Цели и клики
     по телефону уходят туда сами: script.js шлёт их через gtag('event', ...).
     Метрика пока не заведена — как появится номер счётчика, вписать сюда,
     остальной код уже готов её принять. */
  analytics: { ga4: 'G-MM3J82QQXB', metrika: null },
};

/* Разделы сайта: адреса общие, подписи — в языковых словарях */
const routes = [
  { key: 'home', ru: '/', uz: '/uz/' },
  { key: 'project', ru: '/project/', uz: '/uz/project/' },
  { key: 'apartments', ru: '/apartments/', uz: '/uz/apartments/' },
  { key: 'location', ru: '/location/', uz: '/uz/location/' },
  { key: 'contacts', ru: '/contacts/', uz: '/uz/contacts/' },
];

/* Планировки: список общий для обоих языков — id, площадь и блоки от языка
   не зависят, переводятся только подписи. */
const planItems = [
  { id: 'f1-2721', area: '27,21', rooms: 1, blocks: ['1.1/1'] },
  { id: 'f1-3684', area: '36,84', rooms: 1, blocks: ['2/2.1', '2.2'] },
  { id: 'f1-3751', area: '37,51', rooms: 1, blocks: ['1/1.2'] },
  { id: 'f1-3981', area: '39,81', rooms: 1, blocks: ['3', '3.1'] },
  { id: 'f1-4534', area: '45,34', rooms: 1, blocks: ['1/1.1'] },

  { id: 'f2-4146', area: '41,46', rooms: 2, blocks: ['2', '2.1', '2/2'] },
  { id: 'f2-4169', area: '41,69', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-4250', area: '42,50', rooms: 2, blocks: ['1.1/1'] },
  { id: 'f2-4330', area: '43,30', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-4367', area: '43,67', rooms: 2, blocks: ['1', '1.1'] },
  { id: 'f2-4389', area: '43,89', rooms: 2, blocks: ['2.2', '2.2/1'] },
  { id: 'f2-5252', area: '52,52', rooms: 2, blocks: ['1.1/1'] },
  { id: 'f2-5844', area: '58,44', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-6347', area: '63,47', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-6423', area: '64,23', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-6569', area: '65,69', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-6595', area: '65,95', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-6708', area: '67,08', rooms: 2, blocks: ['1', '1.1', '2', '2.1', '2.2', '3', '3.1'] },
  { id: 'f2-6769', area: '67,69', rooms: 2, blocks: ['1', '2.1'] },
  { id: 'f2-6863', area: '68,63', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-6995', area: '69,95', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-7015', area: '70,15', rooms: 2, blocks: ['2.1', '2.2'] },
  { id: 'f2-7052', area: '70,52', rooms: 2, blocks: ['2/2.1', '2.2'] },
  { id: 'f2-7285', area: '72,85', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-7327', area: '73,27', rooms: 2, blocks: ['3', '3.1'] },
  { id: 'f2-7338', area: '73,38', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-7373', area: '73,73', rooms: 2, blocks: ['2/2.1', '2.2'] },
  { id: 'f2-7388', area: '73,88', rooms: 2, blocks: ['1/1.1'] },
  { id: 'f2-7403', area: '74,03', rooms: 2, blocks: ['2/2.1', '2.2'] },

  { id: 'f3-7471', area: '74,71', rooms: 3, blocks: ['1/1.1'] },
  { id: 'f3-8531', area: '85,31', rooms: 3, blocks: ['3', '3.1'] },
  { id: 'f3-9513', area: '95,13', rooms: 3, blocks: ['4.4/1'] },

  { id: 'f4-8911', area: '89,11', rooms: 4, blocks: ['2/2.1', '2.2'] },
];


/* Корпуса: тип, этажность и место на генеральном плане.
   Всё снято с листа «Генеральный план М1:500» (альбом проекта, стр. 3) —
   и подписи в поле листа, и положение пятен застройки. Координаты заданы
   долями ширины и высоты картинки генплана, поэтому разметка не зависит
   от того, в каком размере он показан.

   Номера блоков из рабочих листов застройщика (1, 1.1, 2, 2.1, 2.2, 3, 3.1)
   и типы корпусов с генплана (Тип 1, 2, 2/1, 3, 4…) — две разные нумерации.
   Сопоставление владельцем не подтверждено, поэтому планировки к конкретному
   корпусу здесь не привязываем: кнопка ведёт в общий каталог планировок. */
const blocks = [
  { id: 'n1', type: '3',   floors: 14, scheme: '1+13', x: 11.0, y: 16.5, w: 8.6,  h: 16.5 },
  { id: 'n2', type: '2',   floors: 14, scheme: '1+13', x: 24.5, y: 16.5, w: 12.0, h: 16.5 },
  { id: 'n3', type: '2',   floors: 14, scheme: '1+13', x: 36.5, y: 16.5, w: 12.0, h: 16.5 },
  { id: 'n4', type: '2',   floors: 14, scheme: '1+13', x: 49.5, y: 16.5, w: 12.0, h: 16.5 },
  { id: 'n5', type: '2',   floors: 14, scheme: '1+13', x: 61.5, y: 16.5, w: 12.0, h: 16.5 },
  { id: 'n6', type: '3/1', floors: 14, scheme: '1+13', x: 80.5, y: 16.5, w: 8.6,  h: 16.5 },

  { id: 'w1', type: '2/1', floors: 14, scheme: '1+13', x: 11.0, y: 39.8, w: 8.6,  h: 22.0 },
  { id: 'e1', type: '2/1', floors: 14, scheme: '1+13', x: 80.5, y: 39.8, w: 8.6,  h: 22.0 },

  { id: 's1', type: '4',   floors: 16, scheme: '2+14', x: 9.0,  y: 67.5, w: 19.5, h: 27.8 },
  { id: 's2', type: '1',   floors: 13, scheme: '1+12', x: 29.5, y: 78.6, w: 12.0, h: 18.4 },
  { id: 's3', type: '1/1', floors: 14, scheme: '1+13', x: 43.5, y: 78.6, w: 12.0, h: 18.4 },
  { id: 's4', type: '1',   floors: 13, scheme: '1+12', x: 57.5, y: 78.6, w: 12.0, h: 18.4 },
  { id: 's5', type: '4/1', floors: 16, scheme: '2+14', x: 71.5, y: 67.5, w: 19.5, h: 27.8 },
];

const ru = {
  lang: 'ru',
  dir: '',
  locale: 'ru_RU',
  altLocale: 'uz_UZ',

  ui: {
    skip: 'Перейти к содержимому',
    menu: 'Меню',
    navLabel: 'Разделы сайта',
    langLabel: 'Язык сайта',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    call: 'Позвонить',
    pick: 'Подобрать квартиру',
    sections: 'Разделы страницы',
    areaWord: 'Площади',
    plansWord: 'Планировок',
    write: 'Написать в Telegram',
    scrollNext: 'Листать далее',
    breadcrumbs: 'Вы здесь',
    home: 'Главная',
    legal: 'Информация на сайте не является публичной офертой',
    priceNote: 'Цена указана без учёта скидок. Актуальную стоимость и наличие уточняйте в отделе продаж.',
    openMap: 'Открыть карту',
    closeViewer: 'Закрыть',
    zoomOpen: 'Рассмотреть подробно',
    viewerHint: 'Колесо или щипок — увеличить, перетаскивание — двигать',
    mapHint: 'Карта загрузится по нажатию — так страница открывается быстрее',
    sqm: 'м²',
    planWord: 'планировка',
    legend: 'Условные обозначения',
  },

  nav: {
    project: 'О проекте',
    apartments: 'Квартиры',
    genplan: 'Генплан',
    location: 'Локация',
    contacts: 'Контакты',
  },

  cta: {
    primary: 'Записаться в отдел продаж',
    consult: 'Получить консультацию',
    price: 'Запросить стоимость',
    availability: 'Узнать наличие',
    visit: 'Записаться на просмотр',
  },

  form: {
    name: 'Имя',
    namePlaceholder: 'Как к вам обращаться',
    nameError: 'Пожалуйста, укажите имя',
    phone: 'Телефон',
    phoneError: 'Проверьте номер телефона',
    company: 'Компания',
    rooms: 'Интересующая квартира',
    roomsHint: 'Можно не выбирать — уточним при звонке',
    roomsAny: 'Пока не выбрано',
    roomsList: ['Студия', '1-комнатная', '2-комнатная', '3-комнатная', '4-комнатная'],
    consent: 'Согласен на обработку имени и телефона для обратного звонка',
    // Подтверждено владельцем: заявки видит только отдел продаж.
    privacy: 'Имя и телефон видит только отдел продаж. Третьим лицам данные не передаём.',
    submit: 'Записаться в отдел продаж',
    sending: 'Отправляем…',
    ok: 'Спасибо! Менеджер перезвонит в рабочее время — ежедневно с 9:00 до 20:00.',
    bad: 'Проверьте поля, отмеченные рамкой.',
    fail: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +998 55 705 05 05.',
    // Показывается вместо ok, если заявка оставлена вне часов работы отдела продаж.
    okLate: 'Спасибо! Отдел продаж работает с 9:00 до 20:00 — перезвоним в ближайшее рабочее время.',
  },

  /* ── метаданные страниц: уникальные, без перечисления ключевых слов ── */
  meta: {
    home: {
      title: 'PARI Residence — квартиры премиум-класса в Самарканде',
      description: 'PARI Residence — жилой квартал премиум-класса в Самарканде на улице Гуругли: '
        + 'закрытый двор-парк 1 Га без машин, 13 блоков, квартиры от 27 до 95 м². '
        + 'Узнайте актуальные условия в отделе продаж.',
    },
    project: {
      title: 'О проекте PARI Residence — архитектура и благоустройство',
      description: 'Жилой квартал PARI Residence в Самарканде: архитектура SAFRONOVA PROJECT, '
        + 'фасады из натурального камня, дизайнерские входные группы, двор-парк 1 Га '
        + 'без машин и подземный паркинг.',
    },
    genplan: {
      title: 'Генеральный план PARI Residence — 13 корпусов в Самарканде',
      description: 'Генплан жилого квартала PARI Residence: тринадцать корпусов высотой '
        + 'от 13 до 16 этажей вокруг закрытого двора-парка площадью один гектар.',
    },
    apartments: {
      title: 'Квартиры в Самарканде — PARI Residence',
      description: 'Планировки квартир в жилом квартале PARI Residence в Самарканде: одно-, двух-, '
        + 'трёх- и четырёхкомнатные площадью от 27 до 95 м². На каждом плане — расположение '
        + 'квартиры на этаже и в комплексе.',
    },
    location: {
      title: 'Расположение — PARI Residence в Самарканде',
      description: 'PARI Residence расположен в Самарканде на улице Гуругли, 1: 3 минуты до вокзала, '
        + '15 минут до аэропорта, супермаркеты, школы и торговый центр рядом.',
    },
    contacts: {
      title: 'Отдел продаж PARI Residence в Самарканде — контакты',
      description: 'Отдел продаж PARI Residence: Самарканд, улица Гуругли, 1. Телефон 55 705 05 05. '
        + 'Запишитесь на визит и получите консультацию по квартирам и условиям покупки.',
    },
    notFound: {
      title: 'Страница не найдена — PARI Residence',
      description: 'Такой страницы нет. Перейдите на главную, к квартирам или в контакты PARI Residence.',
    },
  },

  /* ── главная ── */
  home: {
    heroEyebrow: 'Samarqand &nbsp;·&nbsp; Goʻroʻgʻli&nbsp;1',
    heroSlogan: 'Парижское&nbsp;очарование.<br>Самаркандская&nbsp;душа.',
    heroSub: 'Parijona Joziba. Samarqand ruhi.',
    heroAlt: 'PARI Residence — Самарканд на рассвете',

    /* ── v3 (28.08.2026) ──
       Первый экран стал светлым: страница открывается на белом, логотип
       прорисовывается штрихом, кадр квартала раскрывается при прокрутке.
       Разделы пересобраны по сценарию, который заказчик показал как образец. */
    leadScroll: 'Листайте',
    leadFrameAlt: 'PARI Residence — фасады квартала со стороны улицы Гуругли',
    leadPlanAlt: 'PARI Residence — фасады квартала со стороны улицы Гуругли',

    aboutNum: '01',
    aboutEyebrow: 'О проекте',
    aboutTitle: 'Премиальный <em>квартал</em><br>на тринадцать блоков',
    aboutText: 'PARI Residence — жилой квартал премиум-класса в Самарканде: тринадцать блоков '
      + 'высотой от 13 до 16 этажей, 1202 квартиры площадью от 27 до 95 м² и закрытый двор-парк '
      + 'площадью один гектар.',
    aboutText2: 'Проект разработан архитектурным бюро SAFRONOVA PROJECT, застройщик — FD MARAKANDA. '
      + 'Квартиры сдаются в формате white-box.',
    aboutArchAlt: 'Входная группа PARI Residence с лепниной',
    aboutShotAlt: 'Двор-парк PARI Residence',

    filmEyebrow: 'Фильм о проекте',
    filmTitle: 'Каким будет квартал',
    filmNote: 'Кадры имиджевого ролика PARI Residence.',

    pickerTitle: 'Подберите квартиру',
    pickerNote: 'Отберите по комнатности и площади — покажем подходящие планировки.',
    pickerArea: 'Площадь до {n} м²',
    pickerFound: 'планировок подходит',
    pickerEmpty: 'По этим условиям планировок нет — сдвиньте ползунок или выберите другую комнатность.',

    makerEyebrow: 'Кто строит',
    makerTitle: 'Застройщик<br>и архитекторы',
    makerText: 'FD MARAKANDA возводит квартал в две очереди. Архитектура — бюро SAFRONOVA PROJECT: '
      + 'более пятидесяти проектов за пятнадцать лет работы.',
    makerDev: 'Застройщик',
    makerArch: 'Архитектура',

    // Раздел «Концепция» снят с сайта по просьбе заказчика. Тексты оставлены
    // на случай, если он вернётся в другом оформлении.
    conceptNum: '01',
    conceptEyebrow: 'Концепция',
    conceptTitle: 'На встрече двух миров<br>рождается <em>PARI</em>',
    conceptLeft: 'Париж вдохновляет мир своим вкусом, изяществом и удивительным умением '
      + 'соединять городскую архитектуру с природой.',
    conceptRight: 'Самарканд очаровывает иначе. В нём живут глубина истории, восточная '
      + 'утончённость, тепло солнечного света и неповторимая душа.',
    conceptReliefAlt: 'Барельеф: Регистан и Париж в едином орнаменте',
    conceptWhisper: 'В восточной традиции PARI — фея, образ лёгкости и почти волшебного очарования.',

    cineLabel: 'Состав квартала',
    cinePrev: 'Предыдущий раздел',
    cineNext: 'Следующий раздел',
    cineEyebrow: 'Состав квартала',
    cineTitle: 'Всё нужное —<br>внутри квартала',
    /* Каждый слайд — раздел, а не просто кадр: заголовок и короткий абзац
       поверх фотографии. Раньше здесь была лента подписанных кадров, и она
       читалась как случайный набор картинок. */
    cine: [
      {
        img: 'cine-yard', w: [1280, 1920, 2560],
        title: 'Двор-парк',
        text: 'Закрытый двор площадью один гектар: геопластика, водные объекты, многолетние '
          + 'кустарники, плодовые и хвойные деревья. Крытые беседки и гостиные под открытым '
          + 'небом. Машин во дворе нет.',
      },
      {
        img: 'cine-arcade', w: [1280, 1920, 2560],
        title: 'Торговая галерея',
        /* Перечень категорий — с рекламного макета застройщика; ждём
           подтверждения владельца перед публикацией. */
        text: 'Кафе и рестораны, бутики и парфюмерные магазины, салоны красоты, цветочные '
          + 'лавки — вдоль первых этажей, под аркадами.',
      },
      {
        img: 'cine-lobby', w: [1280, 1672],
        title: 'Входные группы',
        text: 'Лобби с латунью, натуральным камнем и лепниной. Дизайнерские входные группы '
          + 'разработаны бюро SAFRONOVA PROJECT.',
      },
      {
        img: 'cine-balcony', w: [1280, 1920, 2560],
        title: 'Вид с высоты',
        text: 'С верхних этажей открывается панорама Самарканда — города, ради которого '
          + 'сюда и приезжают.',
      },
      {
        img: 'cine-parking', w: [1280, 1535],
        title: 'Паркинг',
        text: 'Подземный и наземный паркинг. Открытая парковка на 148 машино-мест — '
          + 'по генеральному плану.',
      },
    ],

    /* Эти кадры раньше стояли последними в ленте и при обычной прокрутке
       не показывались вовсе — теперь у них отдельный разворот. */
    galleryEyebrow: 'Проект в деталях',
    galleryTitle: 'Лобби, галереи<br>и вид с балкона',
    gallery: [
      { img: 'cine-lobby', w: [1280, 1672], cap: 'Входная группа с лобби', big: true },
      { img: 'cine-balcony', w: [1280, 1920, 2560], cap: 'Вид на Самарканд с балкона' },
      { img: 'cine-arcade', w: [1280, 1920, 2560], cap: 'Галерея вдоль первых этажей' },
      { img: 'cine-parking', w: [1280, 1535], h: 1024, cap: 'Подземный паркинг', wide: true },
    ],

    yardNum: '03',
    yardEyebrow: 'Двор-парк',
    yardTitle: 'Один гектар двора,<br>в котором нет машин',
    yardText: 'Закрытый двор-парк площадью 1 га: геопластика, водные объекты, многолетние кустарники, '
      + 'плодовые и хвойные деревья. Крытые беседки и гостиные под открытым небом.',
    yardAlt: 'Двор-парк PARI Residence: цветение и прогулочные дорожки',
    stats: [
      { value: 13, label: 'блоков' },
      { value: 1202, label: 'квартиры' },
      { value: 30, suffix: '%', label: 'озеленения' },
      { value: 1, label: 'гектар двора' },
    ],

    placeNum: '04',
    placeEyebrow: 'Локация',
    placeTitle: 'Самарканд<br>в шаге отсюда',
    placeReliefAlt: 'Барельеф: девушка на велосипеде у парижского фасада',

    homesNum: '01',
    homesEyebrow: 'Квартиры',
    homesTitle: 'От компактных однокомнатных<br>до семейных четырёхкомнатных',
    /* Планировки вынесены в общую ленту главной: раньше они жили только на
       отдельной странице, а в меню заходят далеко не все. */
    homesPreview: ['f1-2721', 'f1-3981', 'f2-4169', 'f2-6708', 'f3-8531', 'f4-8911'],
    homesTiles: [
      { value: 'от 27 м²', label: 'Однокомнатные', href: '/apartments/#rooms-1' },
      { value: 'для семьи', label: 'Двух- и трёхкомнатные', href: '/apartments/#rooms-2' },
      { value: 'до 95 м²', label: 'Три и четыре комнаты', href: '/apartments/#rooms-4' },
    ],
    homesNote: 'Свободные квартиры и этажи покажем в отделе продаж.',
    homesLink: 'Все планировки',
    homesAlt: 'Входная группа PARI Residence: лобби с латунью и натуральным камнем',

    /* Раздел «Архитектурные решения» на главной: заказчик просил показать
       фасады и входные группы вблизи — это то, что продаёт проект. */
    archNum: '02',
    archEyebrow: 'Архитектурные решения',
    archTitle: 'Натуральный камень,<br>латунь и лепнина',
    archText: 'Выразительные фасады с натуральным камнем и декоративными элементами, '
      + 'дизайнерские входные группы, аркады вдоль первых этажей. '
      + 'Проект разработан бюро SAFRONOVA PROJECT.',
    archLink: 'Подробнее о проекте',
    arch: [
      { img: 'arch-facade', cap: 'Аркада вдоль первых этажей', big: true },
      { img: 'arch-entrance', cap: 'Входная группа с лепниной' },
      { img: 'arch-stone', cap: 'Травертин на парапетах двора' },
      { img: 'arch-balcony', cap: 'Балкон: стекло и латунь', wide: true },
    ],

    /* Мастер-план района на главной: заказчик просил показать, каким «Залиния»
       станет в будущем, а не прятать план на отдельной странице. */
    masterEyebrow: 'Район «Залиния»',
    masterTitle: 'Квартал растёт<br>вместе с районом',
    masterText: 'PARI Residence отмечен золотом у улицы Гуругли. Вокруг — парк, пешеходные бульвары, '
      + 'новые школы, детский сад, городской университет и торговый центр.',
    masterLink: 'Смотреть мастер-план',

    finalEyebrow: 'Отдел продаж',
    finalTitle: 'Очарование,<br>ставшее домом',
    finalText: 'Оставьте имя и телефон — менеджер расскажет о свободных квартирах и условиях покупки, '
      + 'согласует удобное время визита.',
  },

  /* ── список «сколько ехать»: общий для главной, локации и контактов ──
     TODO(владелец): времена не подтверждены документом; подпись «на машине» добавлена,
     потому что пешком те же цифры недостижимы. */
  distancesNote: 'Время в пути на машине',
  distances: [
    ['Ж/д вокзал', '3 минуты'],
    ['Супермаркет Korzinka', '3 минуты'],
    ['ТЦ Festival Mall', '5 минут'],
    ['Стадион «Локомотив»', '10 минут'],
    ['Международный аэропорт', '15 минут'],
  ],

  /* Планировки: по одной на каждую площадь из финального буклета застройщика.
     Одинаковые площади повторяются в нескольких блоках зеркально — их собираем
     в одну карточку и перечисляем блоки. Картинки готовит tools/make-plans.py:
     в карточке — чертёж, в увеличении — страница буклета целиком, вместе с
     розой инсоляции, расположением на этаже и расположением в комплексе. */

  genplan: {
    h1: 'Генеральный план',
    lead: 'Тринадцать корпусов вокруг закрытого двора-парка. Наведите на корпус, '
      + 'чтобы увидеть его тип и этажность.',
    planAlt: 'Генеральный план PARI Residence в масштабе 1:500',
    hint: 'Выберите корпус на плане',
    swipe: 'Проведите по плану вбок',
    blockWord: 'Корпус',
    typeWord: 'Тип',
    floorsWord: 'этажей',
    schemeWord: 'из них первый — нежилой',
    note: 'Свободные квартиры и этажи в выбранном корпусе покажем в отделе продаж: '
      + 'наличие меняется каждый день.',
    toPlans: 'Смотреть планировки',
    legendTitle: 'Что на плане',
    legend: [
      ['13', 'корпусов'],
      ['13–16', 'этажей'],
      ['1202', 'квартиры'],
      ['1', 'гектар двора'],
    ],
    source: 'План приведён по листу «Генеральный план М1:500» из альбома проекта.',
  },
  plans: {
    title: 'Планировки',
    lead: 'Выберите комнатность и нажмите на план: он откроется целиком — с размерами, '
      + 'подписями комнат, расположением квартиры на этаже и в комплексе.',
    note: 'Показаны типовые планировки. Свободные квартиры, этажи и стоимость уточняйте в отделе продаж.',
    zoom: 'Открыть план крупно',
    filterLabel: 'Комнатность',
    filterAll: 'Все',
    filterRooms: ['', '1 комната', '2 комнаты', '3 комнаты', '4 комнаты'],
    countWord: ['планировок', 'планировка', 'планировки'],
    blockWord: ['', 'Блок', 'Блоки'],
    roomWord: ['', '1-комнатная', '2-комнатная', '3-комнатная', '4-комнатная'],
    items: planItems,
  },

  /* ── страница квартир ── */
  apartments: {
    h1: 'Квартиры в PARI Residence',
    lead: '1202 квартиры в 13 блоках — от однокомнатной до четырёхкомнатной, от 27 до 95 м². '
      + 'Балконы, кухни-гостиные и закрытый двор-парк без машин.',
    priceLine: 'Квартиры от 10 млн сум за м²',
    termsTitle: 'Сроки и условия',
    termsLead: 'Дом строится двумя очередями. Рассрочка беспроцентная и рассчитана до сдачи '
      + 'первой очереди: чем ближе срок, тем короче остаток.',
    termsStage: '{n}-я очередь',
    termsBlocks: 'блоков',
    termsQuarter: 'квартал',
    termsInstalmentTitle: 'Рассрочка',
    termsInstalmentText: 'Без процентов, до сдачи первой очереди',
    termsMonths: 'месяцев сейчас',
    termsDeveloperTitle: 'Застройщик',
    termsBankTitle: 'Банк-партнёр',
    termsNowTitle: 'Сейчас на площадке',
    termsNote: 'Условия рассрочки и график платежей уточняйте в отделе продаж.',
    finishTitle: 'Как выбрать квартиру',
    finishText: 'Позвоните — менеджер уточнит, что вам подходит, и назначит удобное время. '
      + 'В отделе продаж покажем свободные квартиры на этажах, планировки в деталях, '
      + 'виды из окон и расскажем об условиях покупки.',
  },

  /* ── страница «О проекте» ──
     Тексты и списки взяты из финального буклета застройщика, разделы 02–06 и 11.
     Ничего не досочинено: если в буклете цифры нет, её нет и здесь. */
  project: {
    h1: 'О проекте PARI Residence',
    lead: 'ЖК «PARI Residence» — современный жилой квартал премиум-класса в Самарканде, '
      + 'возводимый в новом районе «Залиния» на улице Гуругли. Территории бывших промышленных '
      + 'предприятий уже выкуплены крупными и средними девелоперами и активно развиваются.',
    lead2: 'Здесь появится новый микрорайон с благоустроенной парковой зоной, пешеходными '
      + 'бульварами, кафе и ресторанами, салонами красоты и спа, цветочными магазинами, '
      + 'спортивными комплексами и зонами отдыха. Для семей построят детские сады, школы '
      + 'и поликлинику, а рядом город построит новый университет.',

    facts: [
      { value: '13', label: 'жилых блоков' },
      { value: '1202', label: 'квартиры' },
      { value: '1 Га', label: 'двор-парк без машин' },
      { value: '27–95', label: 'м² площадь квартир' },
    ],

    aerialTitle: 'Собственный двор-парк и коммерческая инфраструктура',
    aerialText: 'В самом жилом комплексе PARI Residence будет собственный закрытый двор-парк '
      + 'общей площадью 1 Га, а также коммерческая инфраструктура.',
    aerialAlt: 'PARI Residence с высоты: закрытый двор-парк между жилыми блоками',
    aerialList: [
      'Закрытый двор-парк без машин',
      'Собственная коммерческая инфраструктура',
      'Пешеходный бульвар',
      'Кафе и рестораны',
      'Салоны красоты и спа',
      'Бутики',
    ],

    archNum: '01',
    archTitle: 'Архитектурные решения',
    archText: 'Архитектурные и дизайнерские решения жилого квартала «PARI Residence» разработаны '
      + '«SAFRONOVA PROJECT» — международным архитектурным бюро с опытом в создании проектов '
      + 'бизнес- и премиум-класса. За последние 15 лет специалисты бюро реализовали более '
      + '50 проектов в крупных городах СНГ.',
    archText2: 'Выразительные фасады с применением натурального камня, декоративных элементов '
      + 'и современных материалов, яркие дизайнерские решения оформления входных групп, '
      + 'продуманное благоустройство дворов и ландшафтный дизайн. Квартиры передаются '
      + 'в формате white-box: чистовой ремонт делается быстро и без лишних затрат.',
    archList: [
      'Выразительные фасады',
      'Натуральные материалы',
      'Дизайнерские входные группы',
      'Продуманное благоустройство и ландшафтный дизайн',
      'Квартиры в формате white-box',
      'Широкий выбор планировочных решений',
    ],
    archGallery: [
      { img: 'arch-facade', cap: 'Аркада первых этажей на закате', big: true },
      { img: 'arch-line', cap: 'Фасады с первой линии' },
      { img: 'arch-stone', cap: 'Травертин парапетов вблизи' },
      { img: 'arch-balcony', cap: 'Балкон: стекло, латунь, камень', wide: true },
    ],

    entryNum: '02',
    entryTitle: 'Входные группы',
    entryText: 'Просторные входные группы каждого дома выполнены по индивидуальному '
      + 'дизайн-проекту. В отделке используются натуральный камень, деревянные и декоративные '
      + 'панели, латунь. Здесь предусмотрены уютные зоны ожидания с мягкой мебелью и тихой '
      + 'музыкой, стены украшены панно и картинами. Для колясок, самокатов и велосипедов '
      + 'отведены отдельные технические помещения.',
    entryAlt: 'Входная группа PARI Residence: арка, лепнина и латунная фурнитура',

    yardNum: '03',
    yardTitle: 'Благоустройство',
    yardText: 'Впервые в Самарканде в PARI Residence будет реализован закрытый двор без машин '
      + 'с собственным парком общей площадью 1 Га. Мастер-план двора, ландшафтный дизайн, '
      + 'геопластика, водные объекты и малые архитектурные формы способны удивить самого '
      + 'искушённого покупателя.',
    yardText2: 'Здесь высадят многолетние кустарники, плодовые и хвойные деревья, разобьют '
      + 'клумбы с цветами. Оборудование игровых и детских площадок, зон отдыха выполняется '
      + 'по индивидуальному дизайн-проекту. На территории парка запроектированы общественные '
      + 'гостиные и крытые беседки для тихого, спокойного отдыха.',
    yardList: [
      'Геопластика',
      'Ландшафтный дизайн',
      'Малые архитектурные формы',
      'Многолетние кустарники',
      'Плодовые и хвойные деревья',
      'Детские и игровые площадки',
      'Оборудование дворов по индивидуальному дизайн-проекту',
      'Общественные гостиные',
    ],
    yardGallery: [
      { img: 'arch-arch', cap: 'Вид на двор через арку', big: true },
      { img: 'arch-yard', cap: 'Беседки и клумбы во дворе' },
      { img: 'arch-pergola', cap: 'Перголы с местами для отдыха' },
    ],

    parkingNum: '04',
    parkingTitle: 'Паркинг',
    parkingText: 'Парковочных мест хватает на всей территории жилого квартала: машину можно '
      + 'оставить в любое время суток. Для молодой аудитории предусмотрены велопарковки '
      + 'и места хранения самокатов.',
    parkingList: [
      'Подземный паркинг',
      'Наземный паркинг',
      'Велопарковка',
      'Места для хранения самокатов',
    ],

    districtTitle: 'Район «Залиния»',
    districtText: 'Квартал строится вместе с районом: рядом появятся парк, пешеходные бульвары, '
      + 'новые школы, детский сад, городской университет и торговый центр.',
    districtLink: 'Смотреть мастер-план района',
    plansLink: 'Смотреть планировки',
  },

  /* ── страница локации ── */
  location: {
    h1: 'Расположение PARI Residence в Самарканде',
    lead: 'Жилой квартал строится на улице Гуругли, 1 — в новом районе «Залиния». Рядом железнодорожный '
      + 'вокзал, супермаркеты, школы и торговый центр, а до международного аэропорта 15 минут на машине.',
    districtTitle: 'Район, который строится вместе с домом',
    masterTitle: 'Мастер-план района «Залиния»',
    masterText: 'PARI Residence отмечен золотом у улицы Гуругли. Нажмите на план, чтобы '
      + 'рассмотреть кварталы, парк, школы и водные объекты вблизи.',
    masterAlt: 'Мастер-план района «Залиния» в Самарканде: кварталы, парк и водные объекты',
    // Легенда набирается на сайте, а не берётся картинкой: так она есть и по-узбекски.
    masterLegend: ['Новые школы', 'Новый детский сад', 'Городской университет', 'Новый торговый центр'],
    districtText: 'Район застраивается заново на месте бывших заводов. Мастер-план предусматривает парк, '
      + 'пешеходные бульвары, кафе, спортивные объекты, детские сады, школы и поликлинику; '
      + 'рядом строится университет.',
    mapTitle: 'Офис продаж на карте',
  },

  /* ── страница контактов ── */
  contacts: {
    h1: 'Отдел продаж PARI Residence в Самарканде',
    lead: 'Приезжайте в отдел продаж — покажем планировки и расскажем об условиях покупки. '
      + 'Позвоните заранее: менеджер оставит для вас время.',
    phoneLabel: 'Телефон отдела продаж',
    hoursLabel: 'Часы работы',
    addressLabel: 'Адрес',
    socialLabel: 'Мы в соцсетях',
    visitTitle: 'Записаться на визит',
    visitText: 'Оставьте имя и телефон — менеджер перезвонит и согласует удобное время.',
  },

  notFound: {
    h1: 'Такой страницы нет',
    text: 'Возможно, адрес набран с опечаткой или страница переехала. Вот куда можно вернуться:',
  },
};

const uz = {
  lang: 'uz',
  dir: '',
  locale: 'uz_UZ',
  altLocale: 'ru_RU',

  ui: {
    skip: 'Kontentga oʻtish',
    menu: 'Menyu',
    navLabel: 'Sayt boʻlimlari',
    langLabel: 'Til',
    openMenu: 'Menyuni ochish',
    closeMenu: 'Menyuni yopish',
    call: 'Qoʻngʻiroq qilish',
    pick: 'Xonadon tanlash',
    sections: 'Sahifa boʻlimlari',
    areaWord: 'Maydonlar',
    plansWord: 'Rejalar',
    write: 'Telegramga yozish',
    scrollNext: 'Pastga oʻtish',
    breadcrumbs: 'Siz shu yerdasiz',
    home: 'Bosh sahifa',
    legal: 'Material maʼlumot uchun boʻlib, ommaviy taklif hisoblanmaydi',
    priceNote: 'Narx chegirmalarsiz koʻrsatilgan. Dolzarb narx va boʻsh xonadonlarni savdo boʻlimidan aniqlang.',
    openMap: 'Xaritani ochish',
    closeViewer: 'Yopish',
    zoomOpen: 'Batafsil koʻrish',
    viewerHint: 'Gʻildirak yoki barmoqlar bilan kattalashtiring, surib koʻchiring',
    mapHint: 'Xarita bosilganda yuklanadi — sahifa shu tufayli tez ochiladi',
    sqm: 'm²',
    planWord: 'tarh',
    legend: 'Shartli belgilar',
  },

  nav: {
    project: 'Loyiha haqida',
    apartments: 'Xonadonlar',
    genplan: 'Bosh reja',
    location: 'Joylashuv',
    contacts: 'Aloqa',
  },

  cta: {
    primary: 'Savdo boʻlimiga yozilish',
    consult: 'Maslahat olish',
    price: 'Narxni bilish',
    availability: 'Boʻsh xonadonlarni bilish',
    visit: 'Koʻrikka yozilish',
  },

  form: {
    name: 'Ism',
    namePlaceholder: 'Ismingiz',
    nameError: 'Iltimos, ismingizni yozing',
    phone: 'Telefon',
    phoneError: 'Telefon raqamini tekshiring',
    company: 'Kompaniya',
    rooms: 'Qiziqtirgan xonadon',
    roomsHint: 'Tanlamasangiz ham boʻladi — qoʻngʻiroqda aniqlaymiz',
    roomsAny: 'Hali tanlanmagan',
    roomsList: ['Studiya', 'Bir xonali', 'Ikki xonali', 'Uch xonali', 'Toʻrt xonali'],
    consent: 'Qayta qoʻngʻiroq uchun ism va telefonni qayta ishlashga roziman',
    privacy: 'Ism va telefonni faqat savdo boʻlimi koʻradi. Uchinchi shaxslarga bermaymiz.',
    submit: 'Savdo boʻlimiga yozilish',
    sending: 'Yuborilmoqda…',
    ok: 'Rahmat! Menejer ish vaqtida — har kuni 9:00 dan 20:00 gacha — qoʻngʻiroq qiladi.',
    bad: 'Belgilangan maydonlarni tekshiring.',
    fail: 'Yuborilmadi. Qayta urinib koʻring yoki qoʻngʻiroq qiling: +998 55 705 05 05.',
    okLate: 'Rahmat! Savdo boʻlimi 9:00 dan 20:00 gacha ishlaydi — eng yaqin ish vaqtida qoʻngʻiroq qilamiz.',
  },

  meta: {
    home: {
      title: 'PARI Residence — Samarqandda premium-klass xonadonlar',
      description: 'PARI Residence — Samarqand, Goʻroʻgʻli koʻchasidagi premium-klass turar-joy majmuasi: '
        + '1 gektarlik mashinasiz yopiq hovli-bogʻ, 13 blok, 27–95 m² xonadonlar. '
        + 'Shartlarni savdo boʻlimidan aniqlang.',
    },
    project: {
      title: 'PARI Residence loyihasi — arxitektura va obodonlashtirish',
      description: 'Samarqanddagi PARI Residence turar-joy kvartali: SAFRONOVA PROJECT arxitekturasi, '
        + 'tabiiy toshli fasadlar, dizayner kirish guruhlari, 1 gektarlik mashinasiz hovli-bogʻ '
        + 'va yer osti avtoturargohi.',
    },
    genplan: {
      title: 'PARI Residence bosh rejasi — Samarqandda 13 blok',
      description: 'PARI Residence turar-joy kvartalining bosh rejasi: bir gektarlik yopiq '
        + 'hovli-bogʻ atrofida 13 dan 16 qavatgacha boʻlgan oʻn uch blok.',
    },
    apartments: {
      title: 'Samarqandda xonadonlar — PARI Residence',
      description: 'Samarqanddagi PARI Residence kvartalidagi xonadon tarhlari: bir, ikki, uch va '
        + 'toʻrt xonali, maydoni 27–95 m². Har bir tarhda xonadonning qavatdagi va majmuadagi '
        + 'oʻrni koʻrsatilgan.',
    },
    location: {
      title: 'Joylashuvi — Samarqanddagi PARI Residence',
      description: 'PARI Residence Samarqand, Goʻroʻgʻli koʻchasi, 1 manzilida: vokzalgacha 3 daqiqa, '
        + 'aeroportgacha 15 daqiqa, yaqinida supermarketlar, maktablar va savdo markazi.',
    },
    contacts: {
      title: 'PARI Residence savdo boʻlimi — Samarqand, aloqa',
      description: 'PARI Residence savdo boʻlimi: Samarqand, Goʻroʻgʻli koʻchasi, 1. Telefon 55 705 05 05. '
        + 'Tashrifga yoziling va xonadonlar boʻyicha maslahat oling.',
    },
    notFound: {
      title: 'Sahifa topilmadi — PARI Residence',
      description: 'Bunday sahifa yoʻq. Bosh sahifaga, xonadonlarga yoki aloqa boʻlimiga oʻting.',
    },
  },

  home: {
    heroEyebrow: 'Samarqand &nbsp;·&nbsp; Goʻroʻgʻli&nbsp;1',
    heroSlogan: 'Parijona&nbsp;Joziba.<br>Samarqand&nbsp;ruhi.',
    heroSub: 'Парижское очарование. Самаркандская душа.',
    heroAlt: 'PARI Residence — tong otishida Samarqand',

    /* ── v3 (28.08.2026): birinchi ekran yorugʻ boʻldi, boʻlimlar qayta yigʻildi ── */
    leadScroll: 'Varaqlang',
    leadFrameAlt: 'PARI Residence — Goʻroʻgʻli koʻchasi tomonidan kvartal fasadlari',
    leadPlanAlt: 'PARI Residence — Goʻroʻgʻli koʻchasi tomonidan fasadlar',

    aboutNum: '01',
    aboutEyebrow: 'Loyiha haqida',
    aboutTitle: 'Oʻn uch blokdan iborat<br><em>premium</em> kvartal',
    aboutText: 'PARI Residence — Samarqanddagi premium toifadagi turar-joy kvartali: 13 dan 16 '
      + 'qavatgacha boʻlgan oʻn uch blok, 27 dan 95 m² gacha 1202 xonadon va bir gektarlik '
      + 'yopiq hovli-bogʻ.',
    aboutText2: 'Loyiha SAFRONOVA PROJECT arxitektura byurosi tomonidan ishlab chiqilgan, '
      + 'quruvchi — FD MARAKANDA. Xonadonlar white-box koʻrinishida topshiriladi.',
    aboutArchAlt: 'PARI Residence kirish guruhi',
    aboutShotAlt: 'PARI Residence hovli-bogʻi',

    filmEyebrow: 'Loyiha haqida film',
    filmTitle: 'Kvartal qanday boʻladi',
    filmNote: 'PARI Residence imij rolikidan kadrlar.',

    pickerTitle: 'Xonadon tanlang',
    pickerNote: 'Xonalar soni va maydon boʻyicha saralang — mos rejalarni koʻrsatamiz.',
    pickerArea: '{n} m² gacha',
    pickerFound: 'ta reja mos keladi',
    pickerEmpty: 'Bu shartlarga mos reja yoʻq — slayderni suring yoki boshqa xonalar sonini tanlang.',

    makerEyebrow: 'Kim quradi',
    makerTitle: 'Quruvchi<br>va arxitektorlar',
    makerText: 'FD MARAKANDA kvartalni ikki navbatda quradi. Arxitektura — SAFRONOVA PROJECT '
      + 'byurosi: oʻn besh yil ichida ellikdan ortiq loyiha.',
    makerDev: 'Quruvchi',
    makerArch: 'Arxitektura',

    // Раздел «Концепция» снят с сайта по просьбе заказчика. Тексты оставлены
    // на случай, если он вернётся в другом оформлении.
    conceptNum: '01',
    conceptEyebrow: 'Konsepsiya',
    conceptTitle: 'Ikki dunyo uchrashgan joyda<br><em>PARI</em> tugʻiladi',
    conceptLeft: 'Parij dunyoni oʻz didi, nafisligi va shahar arxitekturasini tabiat bilan '
      + 'uygʻunlashtira olish mahorati bilan ilhomlantiradi.',
    conceptRight: 'Samarqand esa boshqacha maftun etadi. Unda tarixning teranligi, sharqona '
      + 'nafislik, quyosh nurining iliqligi va betakror ruh yashaydi.',
    conceptReliefAlt: 'Barelyef: Registon va Parij yagona naqshda',
    conceptWhisper: 'Sharq anʼanasida PARI — pari, yengillik va sehrli joziba timsoli.',

    cineLabel: 'Kvartal tarkibi',
    cinePrev: 'Oldingi boʻlim',
    cineNext: 'Keyingi boʻlim',
    cineEyebrow: 'Kvartal tarkibi',
    cineTitle: 'Kerakli hamma narsa —<br>kvartal ichida',
    cine: [
      {
        img: 'cine-yard', w: [1280, 1920, 2560],
        title: 'Hovli-bogʻ',
        text: 'Bir gektarlik yopiq hovli: geoplastika, suv obyektlari, koʻp yillik butalar, '
          + 'mevali va ignabargli daraxtlar. Yopiq soyabonlar va ochiq havodagi mehmonxonalar. '
          + 'Hovlida avtomobillar yoʻq.',
      },
      {
        img: 'cine-arcade', w: [1280, 1920, 2560],
        title: 'Savdo galereyasi',
        text: 'Kafe va restoranlar, butiklar va parfyumeriya doʻkonlari, goʻzallik salonlari, '
          + 'gul doʻkonlari — birinchi qavatlar boʻylab, arkadalar ostida.',
      },
      {
        img: 'cine-lobby', w: [1280, 1672],
        title: 'Kirish guruhlari',
        text: 'Latun, tabiiy tosh va gansimon bezaklar bilan lobbi. Kirish guruhlari '
          + 'SAFRONOVA PROJECT byurosi loyihasi.',
      },
      {
        img: 'cine-balcony', w: [1280, 1920, 2560],
        title: 'Balandlikdan manzara',
        text: 'Yuqori qavatlardan Samarqand panoramasi ochiladi — odamlar shu shahar uchun '
          + 'bu yerga keladi.',
      },
      {
        img: 'cine-parking', w: [1280, 1535],
        title: 'Avtoturargoh',
        text: 'Yer osti va yer usti avtoturargohi. Bosh reja boʻyicha 148 mashina-oʻrinli '
          + 'ochiq parkovka.',
      },
    ],

    galleryEyebrow: 'Loyiha tafsilotlari',
    galleryTitle: 'Lobbi, galereyalar<br>va balkondan manzara',
    gallery: [
      { img: 'cine-lobby', w: [1280, 1672], cap: 'Kirish guruhi va lobbi', big: true },
      { img: 'cine-balcony', w: [1280, 1920, 2560], cap: 'Balkondan Samarqand manzarasi' },
      { img: 'cine-arcade', w: [1280, 1920, 2560], cap: 'Birinchi qavatlar boʻylab galereya' },
      { img: 'cine-parking', w: [1280, 1535], h: 1024, cap: 'Yer osti avtoturargohi', wide: true },
    ],

    yardNum: '03',
    yardEyebrow: 'Hovli-bogʻ',
    yardTitle: 'Bir gektar hovli —<br>mashinalarsiz',
    yardText: '1 gektarlik yopiq hovli-bogʻ: geoplastika, suv havzalari, koʻp yillik butalar, '
      + 'mevali va ignabargli daraxtlar. Yopiq soʻrilar va ochiq havodagi dam olish xonalari.',
    yardAlt: 'PARI Residence hovli-bogʻi: gullar va sayr yoʻlkalari',
    stats: [
      { value: 13, label: 'blok' },
      { value: 1202, label: 'xonadon' },
      { value: 30, suffix: '%', label: 'koʻkalamzorlik' },
      { value: 1, label: 'gektar hovli' },
    ],

    placeNum: '04',
    placeEyebrow: 'Joylashuv',
    placeTitle: 'Samarqand<br>bir qadam narida',
    placeReliefAlt: 'Barelyef: parij fasadi yonida velosipedda ketayotgan qiz',

    homesNum: '01',
    homesEyebrow: 'Xonadonlar',
    homesTitle: 'Ixcham bir xonalidan<br>oilaviy toʻrt xonaligacha',
    homesPreview: ['f1-2721', 'f1-3981', 'f2-4169', 'f2-6708', 'f3-8531', 'f4-8911'],
    homesTiles: [
      { value: '27 m²dan', label: 'Bir xonali', href: '/uz/apartments/#rooms-1' },
      { value: 'oila uchun', label: 'Ikki va uch xonali', href: '/uz/apartments/#rooms-2' },
      { value: '95 m²gacha', label: 'Uch va toʻrt xonali', href: '/uz/apartments/#rooms-4' },
    ],
    homesNote: 'Boʻsh xonadonlar va qavatlarni savdo boʻlimida koʻrsatamiz.',
    homesLink: 'Barcha tarhlar',
    homesAlt: 'PARI Residence kirish guruhi: guruch va tabiiy toshli lobbi',

    archNum: '02',
    archEyebrow: 'Arxitektura yechimlari',
    archTitle: 'Tabiiy tosh,<br>guruch va ganch',
    archText: 'Tabiiy tosh va bezak elementlari bilan ishlangan taʼsirchan fasadlar, dizayner '
      + 'kirish guruhlari, birinchi qavatlar boʻylab arkadalar. Loyihani SAFRONOVA PROJECT '
      + 'byurosi ishlab chiqqan.',
    archLink: 'Loyiha haqida batafsil',
    arch: [
      { img: 'arch-facade', cap: 'Birinchi qavatlar boʻylab arkada', big: true },
      { img: 'arch-entrance', cap: 'Ganch bezakli kirish guruhi' },
      { img: 'arch-stone', cap: 'Hovli parapetlaridagi travertin' },
      { img: 'arch-balcony', cap: 'Balkon: shisha va guruch', wide: true },
    ],

    masterEyebrow: '«Zaliniya» mahallasi',
    masterTitle: 'Kvartal mahalla bilan<br>birga oʻsib boradi',
    masterText: 'PARI Residence Goʻroʻgʻli koʻchasi yonida oltin rangda belgilangan. Atrofda park, '
      + 'piyodalar bulvarlari, yangi maktablar, bogʻcha, shahar universiteti va savdo markazi.',
    masterLink: 'Bosh rejani koʻrish',

    finalEyebrow: 'Savdo boʻlimi',
    finalTitle: 'Uyga aylangan<br>joziba',
    finalText: 'Ism va telefoningizni qoldiring — menejer boʻsh xonadonlar va sotib olish shartlari '
      + 'haqida aytib beradi hamda tashrif vaqtini kelishadi.',
  },

  distancesNote: 'Mashinada yoʻl vaqti',
  distances: [
    ['Temir yoʻl vokzali', '3 daqiqa'],
    ['Korzinka supermarketi', '3 daqiqa'],
    ['Festival Mall savdo markazi', '5 daqiqa'],
    ['«Lokomotiv» stadioni', '10 daqiqa'],
    ['Xalqaro aeroport', '15 daqiqa'],
  ],


  genplan: {
    h1: 'Bosh reja',
    lead: 'Yopiq hovli-bogʻ atrofida oʻn uch blok. Blokning turi va qavatlar sonini '
      + 'koʻrish uchun uning ustiga olib boring.',
    planAlt: 'PARI Residence bosh rejasi, masshtab 1:500',
    hint: 'Rejadan blokni tanlang',
    swipe: 'Rejani yon tomonga suring',
    blockWord: 'Blok',
    typeWord: 'Tur',
    floorsWord: 'qavat',
    schemeWord: 'birinchisi turar-joy emas',
    note: 'Tanlangan blokdagi boʻsh xonadonlar va qavatlarni savdo boʻlimida koʻrsatamiz: '
      + 'mavjudlik har kuni oʻzgaradi.',
    toPlans: 'Rejalarni koʻrish',
    legendTitle: 'Rejada nima bor',
    legend: [
      ['13', 'blok'],
      ['13–16', 'qavat'],
      ['1202', 'xonadon'],
      ['1', 'gektar hovli'],
    ],
    source: 'Reja loyiha albomidagi «Bosh reja M1:500» varagʻi boʻyicha keltirilgan.',
  },
  plans: {
    title: 'Xonadon tarhlari',
    lead: 'Xonalar sonini tanlang va tarhni bosing: u toʻliq ochiladi — oʻlchamlari, xona '
      + 'nomlari, xonadonning qavatdagi va majmuadagi oʻrni bilan.',
    note: 'Namunaviy tarhlar koʻrsatilgan. Boʻsh xonadonlar, qavatlar va narxlarni savdo boʻlimidan aniqlang.',
    zoom: 'Tarhni kattalashtirish',
    filterLabel: 'Xonalar soni',
    filterAll: 'Barchasi',
    filterRooms: ['', '1 xona', '2 xona', '3 xona', '4 xona'],
    countWord: ['ta tarh', 'ta tarh', 'ta tarh'],
    blockWord: ['', 'Blok', 'Bloklar'],
    roomWord: ['', 'Bir xonali', 'Ikki xonali', 'Uch xonali', 'Toʻrt xonali'],
    items: planItems,
  },

  apartments: {
    h1: 'PARI Residence xonadonlari',
    lead: 'PARI Residence-da 13 blokda 1202 xonadon: bir xonalidan oilaviy toʻrt xonaligacha. '
      + 'Maydoni 27–95 m², keng balkonlar va mashinasiz yopiq hovli-bogʻ.',
    priceLine: 'Xonadonlar 1 m² uchun 10 mln soʻmdan',
    termsTitle: 'Muddatlar va shartlar',
    termsLead: 'Uy ikki navbatda quriladi. Boʻlib toʻlash foizsiz va birinchi navbat '
      + 'topshirilgunga qadar hisoblanadi: muddat yaqinlashgani sari qoldiq qisqaradi.',
    termsStage: '{n}-navbat',
    termsBlocks: 'blok',
    termsQuarter: 'chorak',
    termsInstalmentTitle: 'Boʻlib toʻlash',
    termsInstalmentText: 'Foizsiz, birinchi navbat topshirilgunga qadar',
    termsMonths: 'oy hozircha',
    termsDeveloperTitle: 'Quruvchi',
    termsBankTitle: 'Hamkor bank',
    termsNowTitle: 'Hozir qurilishda',
    termsNote: 'Boʻlib toʻlash shartlari va toʻlov jadvalini savdo boʻlimidan aniqlang.',
    finishTitle: 'Xonadonni qanday tanlash mumkin',
    finishText: 'Qoʻngʻiroq qiling — menejer sizga nima mos kelishini aniqlaydi va qulay vaqt belgilaydi. '
      + 'Savdo boʻlimida qavatlardagi boʻsh xonadonlarni, rejalarni batafsil, deraza manzaralarini '
      + 'koʻrsatamiz va sotib olish shartlarini tushuntiramiz.',
  },

  /* ── «Loyiha haqida» sahifasi: matnlar buklet bo‘limlaridan (02–06, 11) ── */
  project: {
    h1: 'PARI Residence loyihasi haqida',
    lead: '«PARI Residence» — Samarqandda, Goʻroʻgʻli koʻchasidagi yangi «Zaliniya» mahallasida '
      + 'qurilayotgan zamonaviy premium-klass turar-joy kvartali. Sobiq sanoat korxonalari hududlari '
      + 'yirik va oʻrta developerlar tomonidan sotib olingan va faol rivojlanmoqda.',
    lead2: 'Bu yerda obod park zonasi, piyodalar bulvarlari, kafe va restoranlar, goʻzallik '
      + 'salonlari va spa, gul doʻkonlari, sport majmualari va dam olish zonalari boʻlgan yangi '
      + 'mahalla paydo boʻladi. Oilalar uchun bogʻchalar, maktablar va poliklinika quriladi, '
      + 'yaqin atrofda esa shahar yangi universitet quradi.',

    facts: [
      { value: '13', label: 'turar-joy bloki' },
      { value: '1202', label: 'xonadon' },
      { value: '1 Ga', label: 'mashinasiz hovli-bogʻ' },
      { value: '27–95', label: 'm² xonadon maydoni' },
    ],

    aerialTitle: 'Oʻz hovli-bogʻi va tijorat infratuzilmasi',
    aerialText: 'PARI Residence turar-joy majmuasining oʻzida umumiy maydoni 1 gektar boʻlgan '
      + 'yopiq hovli-bogʻ, shuningdek tijorat infratuzilmasi boʻladi.',
    aerialAlt: 'PARI Residence tepadan: turar-joy bloklari orasidagi yopiq hovli-bogʻ',
    aerialList: [
      'Mashinasiz yopiq hovli-bogʻ',
      'Oʻz tijorat infratuzilmasi',
      'Piyodalar bulvari',
      'Kafe va restoranlar',
      'Goʻzallik salonlari va spa',
      'Butiklar',
    ],

    archNum: '01',
    archTitle: 'Arxitektura yechimlari',
    archText: '«PARI Residence» turar-joy kvartalining arxitektura va dizayn yechimlari '
      + '«SAFRONOVA PROJECT» — biznes va premium-klass loyihalarini yaratish tajribasiga ega '
      + 'xalqaro arxitektura byurosi tomonidan ishlab chiqilgan. Soʻnggi 15 yilda byuro '
      + 'mutaxassislari MDH yirik shaharlarida 50 dan ortiq loyihani amalga oshirgan.',
    archText2: 'Tabiiy tosh, bezak elementlari va zamonaviy materiallar qoʻllangan taʼsirchan '
      + 'fasadlar, kirish guruhlarining yorqin dizayn yechimlari, puxta oʻylangan hovli '
      + 'obodonchiligi va landshaft dizayni. Xonadonlar white-box formatida topshiriladi: '
      + 'taʼmirni tez va ortiqcha sarf-xarajatsiz yakunlash mumkin.',
    archList: [
      'Taʼsirchan fasadlar',
      'Tabiiy materiallar',
      'Dizayner kirish guruhlari',
      'Puxta obodonchilik va landshaft dizayni',
      'White-box formatidagi xonadonlar',
      'Keng tarh tanlovi',
    ],
    archGallery: [
      { img: 'arch-facade', cap: 'Quyosh botishida birinchi qavatlar arkadasi', big: true },
      { img: 'arch-line', cap: 'Birinchi liniyadan fasadlar' },
      { img: 'arch-stone', cap: 'Parapet travertini yaqindan' },
      { img: 'arch-balcony', cap: 'Balkon: shisha, guruch, tosh', wide: true },
    ],

    entryNum: '02',
    entryTitle: 'Kirish guruhlari',
    entryText: 'Har bir uyning keng kirish guruhi alohida dizayn-loyiha boʻyicha bajarilgan. '
      + 'Pardozda tabiiy tosh, yogʻoch va bezak panellari, guruch ishlatiladi. Bu yerda yumshoq '
      + 'mebel va tinch musiqali kutish zonalari koʻzda tutilgan, devorlarni panno va suratlar '
      + 'bezaydi. Kolyaska, samokat va velosipedlarni saqlash uchun alohida texnik xonalar bor.',
    entryAlt: 'PARI Residence kirish guruhi: arka, ganch bezak va guruch furnitura',

    yardNum: '03',
    yardTitle: 'Obodonlashtirish',
    yardText: 'Samarqandda birinchi marta PARI Residence-da umumiy maydoni 1 gektar boʻlgan '
      + 'oʻz parki bilan mashinasiz yopiq hovli amalga oshiriladi. Hovlining bosh rejasi, '
      + 'landshaft dizayni, geoplastika, suv obyektlari va kichik meʼmoriy shakllar eng talabchan '
      + 'xaridorni ham hayratlantiradi.',
    yardText2: 'Bu yerda koʻp yillik butalar, mevali va ignabargli daraxtlar oʻtqaziladi, gulzorlar '
      + 'barpo etiladi. Oʻyin va bolalar maydonchalari, dam olish zonalari jihozlari alohida '
      + 'dizayn-loyiha boʻyicha bajariladi. Park hududida tinch dam olish uchun umumiy '
      + 'mehmonxonalar va yopiq soʻrilar loyihalangan.',
    yardList: [
      'Geoplastika',
      'Landshaft dizayni',
      'Kichik meʼmoriy shakllar',
      'Koʻp yillik butalar',
      'Mevali va ignabargli daraxtlar',
      'Bolalar va oʻyin maydonchalari',
      'Hovli jihozlari alohida dizayn-loyiha boʻyicha',
      'Umumiy mehmonxonalar',
    ],
    yardGallery: [
      { img: 'arch-arch', cap: 'Arka orqali hovli manzarasi', big: true },
      { img: 'arch-yard', cap: 'Hovlidagi soʻrilar va gulzorlar' },
      { img: 'arch-pergola', cap: 'Dam olish joylari boʻlgan pergolalar' },
    ],

    parkingNum: '04',
    parkingTitle: 'Avtoturargoh',
    parkingText: 'Turar-joy kvartalining butun hududida parkovka joylari yetarli: mashinani '
      + 'kunning istalgan vaqtida qoldirish mumkin. Yosh auditoriya uchun velosiped parkovkalari '
      + 'va samokat saqlash joylari koʻzda tutilgan.',
    parkingList: [
      'Yer osti avtoturargohi',
      'Yer usti avtoturargohi',
      'Velosiped parkovkasi',
      'Samokat saqlash joylari',
    ],

    districtTitle: '«Zaliniya» mahallasi',
    districtText: 'Kvartal mahalla bilan birga quriladi: yaqin atrofda park, piyodalar bulvarlari, '
      + 'yangi maktablar, bogʻcha, shahar universiteti va savdo markazi paydo boʻladi.',
    districtLink: 'Mahalla bosh rejasini koʻrish',
    plansLink: 'Tarhlarni koʻrish',
  },

  location: {
    h1: 'PARI Residence Samarqandda qayerda joylashgan',
    lead: 'Turar-joy majmuasi «Zaliniya» yangi mahallasida, Goʻroʻgʻli koʻchasi, 1 manzilida qurilmoqda. '
      + 'Yaqinida temir yoʻl vokzali, supermarketlar, maktablar va savdo markazi, xalqaro aeroportgacha '
      + 'mashinada 15 daqiqa.',
    districtTitle: 'Uy bilan birga oʻsib borayotgan mahalla',
    masterTitle: '«Zaliniya» mahallasining bosh rejasi',
    masterText: 'PARI Residence Goʻroʻgʻli koʻchasi yonida oltin rangda belgilangan. Kvartallar, park, '
      + 'maktablar va suv havzalarini koʻrish uchun rejani bosing.',
    masterAlt: 'Samarqanddagi «Zaliniya» mahallasi bosh rejasi: kvartallar, park va suv havzalari',
    masterLegend: ['Yangi maktablar', 'Yangi bogʻcha', 'Shahar universiteti', 'Yangi savdo markazi'],
    districtText: 'Mahalla sobiq zavodlar oʻrnida qaytadan quriladi. Bosh rejada park, piyodalar '
      + 'bulvarlari, kafelar, sport obyektlari, bogʻchalar, maktablar va poliklinika koʻzda tutilgan; '
      + 'yaqin atrofda yangi universitet qurilmoqda.',
    mapTitle: 'Savdo boʻlimi xaritada',
  },

  contacts: {
    h1: 'Samarqanddagi PARI Residence savdo boʻlimi',
    lead: 'Savdo boʻlimiga keling — rejalarni koʻrsatamiz, muddatlar va sotib olish shartlari haqida '
      + 'aytib beramiz. Tashrifdan oldin qoʻngʻiroq qiling, menejer siz uchun vaqt ajratadi.',
    phoneLabel: 'Savdo boʻlimi telefoni',
    hoursLabel: 'Ish vaqti',
    addressLabel: 'Manzil',
    socialLabel: 'Ijtimoiy tarmoqlarda',
    visitTitle: 'Tashrifga yozilish',
    visitText: 'Ism va telefoningizni qoldiring — menejer qoʻngʻiroq qilib, qulay vaqtni kelishadi.',
  },

  notFound: {
    h1: 'Bunday sahifa yoʻq',
    text: 'Manzil xato terilgan yoki sahifa koʻchirilgan boʻlishi mumkin. Mana qayerga qaytish mumkin:',
  },
};

module.exports = { site, blocks, routes, ru, uz };
