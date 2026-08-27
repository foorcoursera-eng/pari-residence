/* ==========================================================================
   PARI Residence — контент сайта. Единственный источник текстов и данных:
   отсюда собираются русская и узбекская версии всех страниц (build.js).

   Правило: сюда попадают только подтверждённые данные. Всё, что не подтверждено
   владельцем, помечено TODO и на сайт не выводится.
   ========================================================================== */

'use strict';

/* Адрес сайта. Пока домен pari-residence.uz не привязан к проекту в Vercel,
   canonical и карта сайта обязаны указывать на рабочий адрес — иначе поисковики
   уйдут на несуществующий хост. Переключение делается переменной окружения
   SITE_ORIGIN=https://pari-residence.uz в настройках проекта, без правки кода. */
const ORIGIN = process.env.SITE_ORIGIN || 'https://pari-residence.vercel.app';

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
  splash: true,
  facts: { blocks: 13, apartments: 1202, green: 30, yardHa: 1, areaFrom: 26, areaTo: 89 },

  /* Подтверждено владельцем 26.08.2026: застройщик, деление на очереди,
     сроки сдачи и условия рассрочки. Срок рассрочки привязан к сдаче первой
     очереди, поэтому со временем он сокращается — считается при сборке. */
  developer: { name: 'FD MARAKANDA', confirmed: true },
  stages: [
    { no: 1, blocks: 6, quarter: 3, year: 2029 },
    { no: 2, blocks: 7, quarter: 2, year: 2031 },
  ],
  instalment: { rate: 0, maxMonths: 36, untilStage: 1, confirmed: true },
};

/* Разделы сайта: адреса общие, подписи — в языковых словарях */
const routes = [
  { key: 'home', ru: '/', uz: '/uz/' },
  { key: 'apartments', ru: '/apartments/', uz: '/uz/apartments/' },
  { key: 'location', ru: '/location/', uz: '/uz/location/' },
  { key: 'contacts', ru: '/contacts/', uz: '/uz/contacts/' },
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
  },

  nav: {
    yard: 'Двор-парк',
    apartments: 'Квартиры',
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
      title: 'PARI Residence — квартиры бизнес-класса в Самарканде',
      description: 'PARI Residence — жилой комплекс бизнес-класса в Самарканде на улице Гуругли: '
        + 'закрытый двор-парк 1 Га без машин, 13 блоков, квартиры от 26 до 89 м². '
        + 'Узнайте актуальные условия в отделе продаж.',
    },
    apartments: {
      title: 'Квартиры в Самарканде — PARI Residence',
      description: 'Квартиры в жилом комплексе PARI Residence в Самарканде: студии, одно-, двух-, трёх- '
        + 'и четырёхкомнатные площадью от 26 до 89 м². Наличие и стоимость — '
        + 'в отделе продаж.',
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

    cineLabel: 'Кадры проекта',
    cinePrev: 'Предыдущий кадр',
    cineNext: 'Следующий кадр',
    cine: [
      { img: 'cine-yard', w: [1280, 1920, 2560], cap: 'Двор с зонами отдыха' },
      { img: 'cine-aerial', w: [1280, 1672], cap: 'Двор-парк площадью 1 гектар' },
      { img: 'cine-pergola', w: [1440, 2048], cap: 'Беседки и места для встреч' },
      { img: 'cine-arch', w: [1280, 1920, 2560], cap: 'Двор закрыт для машин' },
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

    yardNum: '02',
    yardEyebrow: 'Двор-парк',
    yardTitle: 'Один гектар двора,<br>в котором нет машин',
    yardText: 'Закрытый двор-парк площадью 1 га: геопластика, водные объекты, многолетние кустарники, '
      + 'плодовые и хвойные деревья. Крытые беседки и гостиные под открытым небом.',
    yardAlt: 'Двор-парк PARI Residence: цветение и прогулочные дорожки',
    stats: [
      { value: 13, label: 'блока' },
      { value: 1202, label: 'квартиры' },
      { value: 30, suffix: '%', label: 'озеленения' },
    ],

    placeNum: '03',
    placeEyebrow: 'Локация',
    placeTitle: 'Самарканд<br>в шаге отсюда',
    placeReliefAlt: 'Барельеф: девушка на велосипеде у парижского фасада',

    homesNum: '01',
    homesEyebrow: 'Квартиры',
    homesTitle: 'От компактных студий<br>до семейных четырёхкомнатных',
    homesTiles: [
      { value: 'от 26 м²', label: 'Студии и однокомнатные', href: '/apartments/#plan-1' },
      { value: 'для семьи', label: 'Двух- и трёхкомнатные', href: '/apartments/#plan-2' },
      { value: 'до 89 м²', label: 'Четырёхкомнатные', href: '/apartments/#plan-4' },
    ],
    homesNote: 'Свободные квартиры и этажи покажем в отделе продаж.',
    homesLink: 'Смотреть квартиры',
    homesAlt: 'Входная группа PARI Residence: лобби с латунью и натуральным камнем',

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

  /* Планировки: показываем выборку, а не каталог — задача сайта довести до звонка.
     Данные взяты из рабочих листов застройщика (блоки 1–3). */
  plans: {
    title: 'Планировки',
    lead: 'Четыре планировки — от однокомнатной до четырёхкомнатной с кухней-гостиной. '
      + 'Нажмите на план, чтобы рассмотреть размеры и подписи комнат.',
    note: 'Это выборка. Полный список планировок, свободные квартиры и стоимость — в отделе продаж.',
    zoom: 'Открыть план крупно',
    euro: 'кухня-гостиная',
    roomWord: ['', '1-комнатная', '2-комнатная', '3-комнатная', '4-комнатная'],
    items: [
      { id: 'b1-04', area: '45,34', rooms: 1, euro: false },
      { id: 'b1-10', area: '65,95', rooms: 2, euro: true },
      { id: 'b3-06', area: '85,31', rooms: 3, euro: true },
      { id: 'b2-05', area: '89,11', rooms: 4, euro: true },
    ],
  },

  /* ── страница квартир ── */
  apartments: {
    h1: 'Квартиры в PARI Residence',
    lead: '1202 квартиры в 13 блоках — от студии до четырёхкомнатной, от 26 до 89 м². '
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
  },

  nav: {
    yard: 'Hovli-bogʻ',
    apartments: 'Xonadonlar',
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
      title: 'PARI Residence — Samarqandda biznes-klass xonadonlar',
      description: 'PARI Residence — Samarqand, Goʻroʻgʻli koʻchasidagi biznes-klass turar-joy majmuasi: '
        + '1 gektarlik mashinasiz yopiq hovli-bogʻ, 13 blok, 26–89 m² xonadonlar. '
        + 'Shartlarni savdo boʻlimidan aniqlang.',
    },
    apartments: {
      title: 'Samarqandda xonadonlar — PARI Residence',
      description: 'PARI Residence turar-joy majmuasidagi xonadonlar: studiya, bir, ikki, uch va toʻrt '
        + 'xonali, maydoni 26–89 m². Narx va boʻsh xonadonlar — savdo boʻlimida.',
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

    cineLabel: 'Loyiha kadrlari',
    cinePrev: 'Oldingi kadr',
    cineNext: 'Keyingi kadr',
    cine: [
      { img: 'cine-yard', w: [1280, 1920, 2560], cap: 'Dam olish zonalari boʻlgan hovli' },
      { img: 'cine-aerial', w: [1280, 1672], cap: '1 gektarlik hovli-bogʻ' },
      { img: 'cine-pergola', w: [1440, 2048], cap: 'Soʻrilar va uchrashuv joylari' },
      { img: 'cine-arch', w: [1280, 1920, 2560], cap: 'Hovli mashinalarsiz' },
    ],

    galleryEyebrow: 'Loyiha tafsilotlari',
    galleryTitle: 'Lobbi, galereyalar<br>va balkondan manzara',
    gallery: [
      { img: 'cine-lobby', w: [1280, 1672], cap: 'Kirish guruhi va lobbi', big: true },
      { img: 'cine-balcony', w: [1280, 1920, 2560], cap: 'Balkondan Samarqand manzarasi' },
      { img: 'cine-arcade', w: [1280, 1920, 2560], cap: 'Birinchi qavatlar boʻylab galereya' },
      { img: 'cine-parking', w: [1280, 1535], h: 1024, cap: 'Yer osti avtoturargohi', wide: true },
    ],

    yardNum: '02',
    yardEyebrow: 'Hovli-bogʻ',
    yardTitle: 'Bir gektar hovli —<br>mashinalarsiz',
    yardText: '1 gektarlik yopiq hovli-bogʻ: geoplastika, suv havzalari, koʻp yillik butalar, '
      + 'mevali va ignabargli daraxtlar. Yopiq soʻrilar va ochiq havodagi dam olish xonalari.',
    yardAlt: 'PARI Residence hovli-bogʻi: gullar va sayr yoʻlkalari',
    stats: [
      { value: 13, label: 'blok' },
      { value: 1202, label: 'xonadon' },
      { value: 30, suffix: '%', label: 'koʻkalamzorlik' },
    ],

    placeNum: '03',
    placeEyebrow: 'Joylashuv',
    placeTitle: 'Samarqand<br>bir qadam narida',
    placeReliefAlt: 'Barelyef: parij fasadi yonida velosipedda ketayotgan qiz',

    homesNum: '01',
    homesEyebrow: 'Xonadonlar',
    homesTitle: 'Ixcham studiyalardan<br>toʻrt xonali oilaviylarigacha',
    homesTiles: [
      { value: '26 m²dan', label: 'Studiya va bir xonali', href: '/uz/apartments/#plan-1' },
      { value: 'oila uchun', label: 'Ikki va uch xonali', href: '/uz/apartments/#plan-2' },
      { value: '89 m²gacha', label: 'Toʻrt xonali', href: '/uz/apartments/#plan-4' },
    ],
    homesNote: 'Boʻsh xonadonlar va qavatlarni savdo boʻlimida koʻrsatamiz.',
    homesLink: 'Xonadonlarni koʻrish',
    homesAlt: 'PARI Residence kirish guruhi: guruch va tabiiy toshli lobbi',

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

  plans: {
    title: 'Xonadon tarhlari',
    lead: 'Toʻrtta tarh — bir xonalidan oshxona-mehmonxonali toʻrt xonaligacha. '
      + 'Oʻlchamlari va xona nomlarini koʻrish uchun tarhni bosing.',
    note: 'Bu tanlov. Tarhlarning toʻliq roʻyxati, boʻsh xonadonlar va narxlar — savdo boʻlimida.',
    zoom: 'Tarhni kattalashtirish',
    euro: 'oshxona-mehmonxona',
    roomWord: ['', 'Bir xonali', 'Ikki xonali', 'Uch xonali', 'Toʻrt xonali'],
    items: [
      { id: 'b1-04', area: '45,34', rooms: 1, euro: false },
      { id: 'b1-10', area: '65,95', rooms: 2, euro: true },
      { id: 'b3-06', area: '85,31', rooms: 3, euro: true },
      { id: 'b2-05', area: '89,11', rooms: 4, euro: true },
    ],
  },

  apartments: {
    h1: 'PARI Residence xonadonlari',
    lead: 'PARI Residence-da 13 blokda 1202 xonadon: ixcham studiyalardan oilaviy toʻrt xonaligacha. '
      + 'Maydoni 26–89 m², keng balkonlar va mashinasiz yopiq hovli-bogʻ.',
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

module.exports = { site, routes, ru, uz };
