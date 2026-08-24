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
    streetUz: 'Gurugli koʻchasi, 1',
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
  // Цена подтверждена владельцем; периодичность обновления он назовёт отдельно.
  price: { from: 10, unit: 'млн сум', unitUz: 'mln soʻm', confirmed: true },
  instagram: 'https://www.instagram.com/pari_residence/',
  // Заставка при первом заходе (медальон, уезжающий вверх). Выключается одной строкой:
  // splash: false — и разметка со скриптом на страницу не попадут.
  splash: true,
  facts: { blocks: 13, apartments: 1202, green: 30, yardHa: 1, areaFrom: 26, areaTo: 89 },
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
    scrollNext: 'Листать далее',
    breadcrumbs: 'Вы здесь',
    home: 'Главная',
    legal: 'Материал носит информационный характер и не является публичной офертой',
    priceNote: 'Актуальную стоимость и наличие уточняйте в отделе продаж.',
    openMap: 'Открыть карту',
    closeViewer: 'Закрыть',
    zoomOpen: 'Рассмотреть подробно',
    viewerHint: 'Колесо или щипок — увеличить, перетаскивание — двигать',
    mapHint: 'Карта загрузится по нажатию — так страница открывается быстрее',
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
    price: 'Узнать стоимость',
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
    roomsAny: 'Ещё не выбрал',
    roomsList: ['Студия', '1-комнатная', '2-комнатная', '3-комнатная', '4-комнатная'],
    consent: 'Даю согласие на обработку персональных данных',
    submit: 'Записаться в отдел продаж',
    sending: 'Отправляем…',
    ok: 'Спасибо! Менеджер отдела продаж свяжется с вами и согласует время визита.',
    bad: 'Проверьте поля, отмеченные рамкой.',
    fail: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам: 55 705 05 05.',
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
    heroEyebrow: 'Samarqand &nbsp;·&nbsp; Gurugli&nbsp;1',
    heroSlogan: 'Парижское&nbsp;очарование.<br>Самаркандская&nbsp;душа.',
    heroSub: 'Parijona Joziba. Samarqand ruhi.',
    heroAlt: 'PARI Residence — Самарканд на рассвете',

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
      { img: 'cine-lobby', w: [1280, 1672], cap: 'Входная группа с лобби' },
      { img: 'cine-arcade', w: [1280, 1920, 2560], cap: 'Галерея вдоль первых этажей' },
      { img: 'cine-parking', w: [1280, 1536], cap: 'Подземный паркинг' },
      { img: 'cine-balcony', w: [1280, 1920, 2560], cap: 'Вид на Самарканд с балкона' },
    ],

    yardNum: '02',
    yardEyebrow: 'Двор-парк',
    yardTitle: 'Один гектар двора,<br>в котором нет машин',
    yardText: 'Впервые в Самарканде — закрытый двор-парк площадью 1 Га. Геопластика, водные объекты, '
      + 'многолетние кустарники, плодовые и хвойные деревья, крытые беседки и общественные гостиные.',
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
    homesNote: 'Планировки на выбор — свободные квартиры и этажи покажем в отделе продаж.',
    homesLink: 'Смотреть квартиры',
    homesAlt: 'Входная группа PARI Residence: лобби с латунью и натуральным камнем',

    finalEyebrow: 'Отдел продаж',
    finalTitle: 'Очарование,<br>ставшее домом',
    finalText: 'Оставьте контакты — менеджер расскажет о свободных планировках, сроках и условиях '
      + 'покупки и согласует удобное время визита.',
  },

  /* ── список «сколько ехать»: общий для главной, локации и контактов ── */
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
    lead: 'Несколько популярных вариантов — от компактной однокомнатной до четырёхкомнатной '
      + 'с кухней-гостиной. Планы кликабельны: откроются крупно, с размерами и подписями комнат.',
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
    lead: 'В PARI Residence — 1202 квартиры в 13 блоках: от компактных студий до семейных '
      + 'четырёхкомнатных. Площади от 26 до 89 м², просторные балконы '
      + 'и закрытый двор-парк без машин.',
    priceLine: 'Квартиры от 10 млн сум',
    types: [
      {
        title: 'Студии и однокомнатные',
        area: 'от 26 м²',
        text: 'Компактные и функциональные планировки для тех, кто покупает первую квартиру '
          + 'или рассматривает вложение.',
        img: 'cine-balcony', w: 1280,
        alt: 'Балкон квартиры PARI Residence на рассвете',
      },
      {
        title: 'Двухкомнатные и трёхкомнатные',
        area: 'для семьи',
        text: 'Просторные комнаты, кухни-гостиные и балконы с видом на двор-парк — формат '
          + 'для семьи с детьми.',
        img: 'cine-arch', w: 1280,
        alt: 'Вид на двор PARI Residence через арку входной группы',
      },
      {
        title: 'Четырёхкомнатные',
        area: 'до 89 м²',
        text: 'Самый большой формат в проекте: место для каждого члена семьи и отдельная '
          + 'зона для гостей.',
        img: 'lobby', w: 1080,
        alt: 'Лобби PARI Residence с латунью и натуральным камнем',
      },
    ],
    finishTitle: 'Как выбрать квартиру',
    finishText: 'Позвоните — менеджер уточнит, что вам подходит, и назначит удобное время. '
      + 'В отделе продаж покажем свободные квартиры на этажах, планировки в деталях, '
      + 'виды из окон и расскажем об условиях покупки и рассрочки.',
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
    districtText: 'Территории бывших промышленных предприятий выкуплены застройщиками и активно '
      + 'развиваются: здесь появятся парковая зона, пешеходные бульвары, кафе и рестораны, '
      + 'спортивные комплексы, детские сады, школы и поликлиника. Город строит рядом новый университет.',
    mapTitle: 'Офис продаж на карте',
  },

  /* ── страница контактов ── */
  contacts: {
    h1: 'Отдел продаж PARI Residence в Самарканде',
    lead: 'Приезжайте в отдел продаж — покажем планировки, расскажем о сроках и условиях покупки. '
      + 'Перед визитом позвоните, чтобы менеджер освободил для вас время.',
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
    call: 'Aloqa',
    scrollNext: 'Pastga oʻtish',
    breadcrumbs: 'Siz shu yerdasiz',
    home: 'Bosh sahifa',
    legal: 'Material maʼlumot uchun boʻlib, ommaviy taklif hisoblanmaydi',
    priceNote: 'Dolzarb narx va boʻsh xonadonlarni savdo boʻlimidan aniqlang.',
    openMap: 'Xaritani ochish',
    closeViewer: 'Yopish',
    zoomOpen: 'Batafsil koʻrish',
    viewerHint: 'Gʻildirak yoki barmoqlar bilan kattalashtiring, surib koʻchiring',
    mapHint: 'Xarita bosilganda yuklanadi — sahifa shu tufayli tez ochiladi',
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
    namePlaceholder: 'Sizga qanday murojaat qilaylik',
    nameError: 'Iltimos, ismingizni yozing',
    phone: 'Telefon',
    phoneError: 'Telefon raqamini tekshiring',
    company: 'Kompaniya',
    rooms: 'Qiziqtirgan xonadon',
    roomsAny: 'Hali tanlamadim',
    roomsList: ['Studiya', 'Bir xonali', 'Ikki xonali', 'Uch xonali', 'Toʻrt xonali'],
    consent: 'Shaxsiy maʼlumotlarni qayta ishlashga rozilik beraman',
    submit: 'Savdo boʻlimiga yozilish',
    sending: 'Yuborilmoqda…',
    ok: 'Rahmat! Savdo boʻlimi menejeri siz bilan bogʻlanib, tashrif vaqtini kelishadi.',
    bad: 'Belgilangan maydonlarni tekshiring.',
    fail: 'Yuborilmadi. Qayta urinib koʻring yoki qoʻngʻiroq qiling: 55 705 05 05.',
  },

  meta: {
    home: {
      title: 'PARI Residence — Samarqandda biznes-klass xonadonlar',
      description: 'PARI Residence — Samarqand, Gurugli koʻchasidagi biznes-klass turar-joy majmuasi: '
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
      description: 'PARI Residence Samarqand, Gurugli koʻchasi, 1 manzilida: vokzalgacha 3 daqiqa, '
        + 'aeroportgacha 15 daqiqa, yaqinida supermarketlar, maktablar va savdo markazi.',
    },
    contacts: {
      title: 'PARI Residence savdo boʻlimi — Samarqand, aloqa',
      description: 'PARI Residence savdo boʻlimi: Samarqand, Gurugli koʻchasi, 1. Telefon 55 705 05 05. '
        + 'Tashrifga yoziling va xonadonlar boʻyicha maslahat oling.',
    },
    notFound: {
      title: 'Sahifa topilmadi — PARI Residence',
      description: 'Bunday sahifa yoʻq. Bosh sahifaga, xonadonlarga yoki aloqa boʻlimiga oʻting.',
    },
  },

  home: {
    heroEyebrow: 'Samarqand &nbsp;·&nbsp; Gurugli&nbsp;1',
    heroSlogan: 'Parijona&nbsp;Joziba.<br>Samarqand&nbsp;ruhi.',
    heroSub: 'Парижское очарование. Самаркандская душа.',
    heroAlt: 'PARI Residence — tong otishida Samarqand',

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
      { img: 'cine-lobby', w: [1280, 1672], cap: 'Kirish guruhi va lobbi' },
      { img: 'cine-arcade', w: [1280, 1920, 2560], cap: 'Birinchi qavatlar boʻylab galereya' },
      { img: 'cine-parking', w: [1280, 1536], cap: 'Yer osti avtoturargohi' },
      { img: 'cine-balcony', w: [1280, 1920, 2560], cap: 'Balkondan Samarqand manzarasi' },
    ],

    yardNum: '02',
    yardEyebrow: 'Hovli-bogʻ',
    yardTitle: 'Bir gektar hovli —<br>mashinalarsiz',
    yardText: 'Samarqandda birinchi marta — 1 gektarlik yopiq hovli-bogʻ. Geoplastika, suv havzalari, '
      + 'koʻp yillik butalar, mevali va ignabargli daraxtlar, yopiq soʻrilar va umumiy mehmonxonalar.',
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
    homesNote: 'Rejalar tanlovi — boʻsh xonadonlar va qavatlarni savdo boʻlimida koʻrsatamiz.',
    homesLink: 'Xonadonlarni koʻrish',
    homesAlt: 'PARI Residence kirish guruhi: guruch va tabiiy toshli lobbi',

    finalEyebrow: 'Savdo boʻlimi',
    finalTitle: 'Uyga aylangan<br>joziba',
    finalText: 'Kontaktlaringizni qoldiring — menejer boʻsh rejalar, muddatlar va sotib olish '
      + 'shartlari haqida aytib beradi hamda tashrif vaqtini kelishadi.',
  },

  distances: [
    ['Temir yoʻl vokzali', '3 daqiqa'],
    ['Korzinka supermarketi', '3 daqiqa'],
    ['Festival Mall savdo markazi', '5 daqiqa'],
    ['«Lokomotiv» stadioni', '10 daqiqa'],
    ['Xalqaro aeroport', '15 daqiqa'],
  ],

  plans: {
    title: 'Rejalar',
    lead: 'Bir nechta ommabop variant — ixcham bir xonalidan oshxona-mehmonxonali toʻrt xonaligacha. '
      + 'Rejalarni bosing: oʻlchamlari va xona nomlari bilan kattalashib ochiladi.',
    note: 'Bu tanlov. Rejalarning toʻliq roʻyxati, boʻsh xonadonlar va narxlar — savdo boʻlimida.',
    zoom: 'Rejani kattalashtirish',
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
    lead: 'PARI Residence’da 13 blokda 1202 xonadon: ixcham studiyalardan oilaviy toʻrt xonaligacha. '
      + 'Maydoni 26–89 m², keng balkonlar va mashinasiz yopiq hovli-bogʻ.',
    priceLine: 'Xonadonlar 10 mln soʻmdan',
    types: [
      {
        title: 'Studiya va bir xonali',
        area: '26 m²dan',
        text: 'Birinchi uyini olayotganlar yoki sarmoya kiritishni rejalashtirganlar uchun '
          + 'ixcham va funksional rejalar.',
        img: 'cine-balcony', w: 1280,
        alt: 'PARI Residence xonadoni balkoni tong palasida',
      },
      {
        title: 'Ikki va uch xonali',
        area: 'oila uchun',
        text: 'Keng xonalar, oshxona-mehmonxonalar va hovli-bogʻga qaragan balkonlar — '
          + 'bolali oilalar uchun format.',
        img: 'cine-arch', w: 1280,
        alt: 'Kirish guruhi ravogʻi orqali PARI Residence hovlisiga nazar',
      },
      {
        title: 'Toʻrt xonali',
        area: '89 m²gacha',
        text: 'Loyihadagi eng katta format: oilaning har bir aʼzosiga joy va mehmonlar uchun '
          + 'alohida zona.',
        img: 'lobby', w: 1080,
        alt: 'PARI Residence lobbisi: guruch va tabiiy tosh',
      },
    ],
    finishTitle: 'Xonadonni qanday tanlash mumkin',
    finishText: 'Qoʻngʻiroq qiling — menejer sizga nima mos kelishini aniqlaydi va qulay vaqt belgilaydi. '
      + 'Savdo boʻlimida qavatlardagi boʻsh xonadonlarni, rejalarni batafsil, deraza manzaralarini '
      + 'koʻrsatamiz va sotib olish hamda boʻlib toʻlash shartlarini tushuntiramiz.',
  },

  location: {
    h1: 'PARI Residence Samarqandda qayerda joylashgan',
    lead: 'Turar-joy majmuasi «Zaliniya» yangi mahallasida, Gurugli koʻchasi, 1 manzilida qurilmoqda. '
      + 'Yaqinida temir yoʻl vokzali, supermarketlar, maktablar va savdo markazi, xalqaro aeroportgacha '
      + 'mashinada 15 daqiqa.',
    districtTitle: 'Uy bilan birga oʻsib borayotgan mahalla',
    masterTitle: '«Zaliniya» mahallasining bosh rejasi',
    masterText: 'PARI Residence Gurugli koʻchasi yonida oltin rangda belgilangan. Kvartallar, park, '
      + 'maktablar va suv havzalarini koʻrish uchun rejani bosing.',
    masterAlt: 'Samarqanddagi «Zaliniya» mahallasi bosh rejasi: kvartallar, park va suv havzalari',
    districtText: 'Sobiq sanoat korxonalari hududlari quruvchilar tomonidan sotib olinib, faol '
      + 'rivojlanmoqda: bu yerda park zonasi, piyodalar bulvarlari, kafe va restoranlar, sport '
      + 'majmualari, bogʻchalar, maktablar va poliklinika paydo boʻladi. Shahar yonida yangi '
      + 'universitet qurmoqda.',
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
