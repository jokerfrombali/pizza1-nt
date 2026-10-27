/* Пицца №1 — витрина и корзина. Без зависимостей. */
(() => {
'use strict';

/* ============================================================
   НАСТРОЙКИ ЗАВЕДЕНИЯ
   ============================================================ */
const SHOP = {
  name:     'Пицца №1',
  tagline:  'Та самая пицца у цирка · с 1993 года',
  city:     'Нижний Тагил',
  address:  'ул. Куйбышева, 14',
  district: 'Гальяно-Горбуновский массив, Ленинский район, 622030',
  phone:    '+7 912 609-77-00',
  mapOid:   '208816783278',   // организация на Яндекс.Картах
  gisId:    '70000001110345484',   // организация в 2ГИС
  mapUrl:   'https://go.2gis.com/Q0HFx',   // карточка и маршрут   // кнопка «Проложить маршрут»
  mapCoords: '59.941992,57.887997',   // долгота,широта метки   // долгота,широта — метка на карте
  mapEmbed: '',   // если задать — используется вместо метки
  hours:    'Ежедневно 10:00 — 20:00',
  eta:      '45 мин',
  rating:   '4.6',
  zones: [
    'ГГМ, Центр, Красный Камень — 45 минут',
    'Выя, Тагилстрой, Вагонка — до часа',
    'Николо-Павловское, Старатель — по договорённости'
  ],
  pickupNote: 'Самовывоз готов через 15 минут после заказа.',
  rules: [
    'За 45 минут до закрытия кафе заказы принимаются только кратно 2, 4 и 8 порциям пиццы.',
    'Мы не готовим блюда, не заявленные в меню.',
    'Внешний вид может отличаться от изображений в меню.',
    'Если у вас аллергия на какие-либо продукты, сообщите об этом при оплате заказа.'
  ]
};

/* порции пиццы: цена считается за порцию 150 гр */
const PORTIONS = [1, 2, 4, 8];

/* ---------- разделы ---------- */
const CATS = [
  { id:'pizza', label:'Пицца'    },
  { id:'drink', label:'Горячие напитки' },
  { id:'juice', label:'Соки и морсы' },
  { id:'soda',  label:'Вода и газировка' },
  { id:'cold',  label:'Холодный чай и энергетики' },
  { id:'milk',  label:'Молочные коктейли' },
  { id:'extra', label:'Разное'   }
];

/* ---------- меню ---------- */
const MENU = [
  { id:'p-meat',    cat:'pizza', name:'Пицца с мясом',      price:160, unit:'150 гр',
    desc:'Фарш, сыр, хмели-сунели, лук, перец, майонез.', top:['bacon','pepper','cheese'] },
  { id:'p-may',     cat:'pizza', name:'«Первомайская»',     price:160, unit:'150 гр',
    desc:'Карбонат, сыр, грибы маринованные, огурец солёный, перец свежий, лук свежий, халапеньо.', top:['ham','mushroom','pepper','chili'] },
  { id:'p-hunt',    cat:'pizza', name:'«Охотничья»',        price:170, unit:'150 гр', tag:'сытная',
    desc:'Колбаски охотничьи, грудка куриная, сыр, помидоры, огурец маринованный, лук красный.', top:['pepperoni','ham','tomato','pepper'] },
  { id:'p-kolbasa', cat:'pizza', name:'Пицца с колбасой',   price:155, unit:'150 гр',
    desc:'Колбаса полукопчёная, сыр, майонез, томатный соус.', top:['pepperoni','cheese'] },
  { id:'p-cheese',  cat:'pizza', name:'Пицца с сыром',      price:140, unit:'150 гр',
    desc:'Сыр, майонез.', top:['cheese'] },
  { id:'p-mush',    cat:'pizza', name:'Пицца с грибами',    price:160, unit:'150 гр',
    desc:'Сыр, грибы, майонез.', top:['mushroom','cheese'] },
  { id:'p-tomato',  cat:'pizza', name:'Пицца с помидорами', price:145, unit:'150 гр',
    desc:'Помидоры, сыр, чеснок, чёрный перец, майонез.', top:['tomato','basil'] },
  { id:'p-jubilee', cat:'pizza', name:'«Юбилейная»',        price:160, unit:'150 гр',
    desc:'Мясо деликатесное, грибы жареные, сыр, помидоры, чеснок, маргарин, зелень, майонез.', top:['ham','mushroom','tomato','basil'] },
  { id:'p-veg',     cat:'pizza', name:'Пицца с ветчиной и свежими овощами', price:155, unit:'150 гр',
    desc:'Ветчина, помидоры, перец болгарский, лук репчатый, сыр, маслины, зелень, майонез.', top:['ham','tomato','pepper','olive'] },
  { id:'p-fant',    cat:'pizza', name:'«Фантазия»',         price:160, unit:'150 гр',
    desc:'Сыр, куриная грудка варёно-копчёная, майонез, грибы жареные, огурцы солёные, ананас.', top:['ham','mushroom','pineapple'] },
  { id:'p-pep',     cat:'pizza', name:'«Пеперони»',         price:160, unit:'150 гр', tag:'острая',
    desc:'Колбаса пепперони, сыр голландский, соус томатный, майонез. По желанию добавим халапеньо.', top:['pepperoni'] },
  { id:'p-brok',    cat:'pizza', name:'«Брокколи»',         price:145, unit:'150 гр', tag:'без мяса',
    desc:'Брокколи, яйцо, масло.', top:['basil','cheese'] },
  { id:'p-chicken', cat:'pizza', name:'Пицца с куриной грудкой', price:170, unit:'160 гр',
    desc:'Грудка копчёная, брокколи, яблоки, грецкие орехи, сливки, сыр, майонез.', top:['ham','basil','cheese'] },

  /* заказ только кратно 2 порциям */
  { id:'p-kolobok', cat:'pizza', name:'Детская «Колобок»',  price:165, unit:'150 гр', tag:'детям', pair:true,
    desc:'Колбаса, сыр, помидоры, перец болгарский, маслины, соус, майонез.', top:['pepperoni','tomato','olive','cheese'] },
  { id:'p-tuna',    cat:'pizza', name:'«Тунец-плюс»',       price:160, unit:'165 гр', pair:true,
    desc:'Тунец, яблоко, лук репчатый, сыр, майонез.', top:['olive','basil','cheese'] },
  { id:'p-village', cat:'pizza', name:'«Деревенская»',      price:145, unit:'150 гр', tag:'без мяса', pair:true,
    desc:'Картофельное пюре, огурец солёный, лук жареный, сыр, майонез.', top:['basil','pepper','cheese'] },
  { id:'p-sweet',   cat:'pizza', name:'«Восточная сладость»', price:135, unit:'125 гр', tag:'сладкая', pair:true,
    desc:'Халва, сыр сливочный, грецкий орех, йогурт.', top:['pineapple','cheese'] },

  { id:'d-coffee',  cat:'drink', name:'Кофе чёрный',        price:45, unit:'180 мл', desc:'Свежесваренный.', art:'cup' },
  { id:'d-coffeeg', cat:'drink', name:'Кофе молотый',       price:null, unit:'180 мл', desc:'Заварной, из молотых зёрен.', art:'cup' },
  { id:'d-coffee3', cat:'drink', name:'Кофе Monarch Classic 3 в 1', price:55, unit:'180 мл', desc:'Растворимый, с молоком и сахаром.', art:'cup' },
  { id:'d-coffee3m',cat:'drink', name:'Кофе Monarch Mild 3 в 1',    price:55, unit:'180 мл', desc:'Мягкий вкус, с молоком и сахаром.', art:'cup' },
  { id:'d-coffee4c',cat:'drink', name:'Кофе Monarch 4 в 1 Карамель',     price:null, unit:'180 мл', desc:'С молоком, сахаром и карамелью.', art:'cup' },
  { id:'d-coffee4n',cat:'drink', name:'Кофе Monarch 4 в 1 Лесной орех',  price:null, unit:'180 мл', desc:'С молоком, сахаром и лесным орехом.', art:'cup' },
  { id:'d-raf',     cat:'drink', name:'Кофе Monarch Раф малиновый',      price:null, unit:'180 мл', desc:'Сливочный раф с малиной.', art:'cup' },
  { id:'d-tea',     cat:'drink', name:'Чай чёрный Greenfield Golden Ceylon', price:45, unit:'180 мл', desc:'Чёрный цейлонский.', art:'cup' },
  { id:'d-teag',    cat:'drink', name:'Чай зелёный Greenfield Flying Dragon', price:45, unit:'180 мл', desc:'Зелёный китайский.', art:'cup' },
  { id:'d-tealem',  cat:'drink', name:'Чай с лимоном',      price:50, unit:'180 мл', desc:'Чёрный чай с долькой лимона.', art:'cup' },

  /* цены null — позиция видна, но заказать нельзя, пока не поставим цену */
  { id:'j-dob-multi',  cat:'juice', name:'Сок Добрый Мультифрукт', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'j-dob-multi-03' }, { v:'1 л', price:null, photo:'j-dob-multi-1' }] },
  { id:'j-dob-apple',  cat:'juice', name:'Сок Добрый Яблоко', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'j-dob-apple-03' }, { v:'1 л', price:null, photo:'j-dob-apple-1' }] },
  { id:'j-dob-tomato', cat:'juice', name:'Сок Добрый Томат', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'j-dob-tomato-03' }, { v:'1 л', price:null, photo:'j-dob-tomato-1' }] },
  { id:'j-dob-orange', cat:'juice', name:'Сок Добрый Апельсин-мандарин', price:null, unit:'0,3 л', desc:'', art:'cup' },
  { id:'j-dob-mors',   cat:'juice', name:'Морс Добрый Брусника-морошка', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-pulpy-orange', cat:'juice', name:'Pulpy Апельсин', desc:'Сок с мякотью апельсина.', art:'cup',
    vols:[{ v:'0,5 л', price:null, photo:'j-pulpy-orange-05' }, { v:'1 л', price:null, photo:'j-pulpy-orange-1' }] },
  { id:'j-pulpy-trop', cat:'juice', name:'Pulpy Тропический', price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'j-vp-ananas',  cat:'juice', name:'Волжский посад Ананас-мандарин', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-vp-granat',  cat:'juice', name:'Волжский посад Гранат-клюква-яблоко', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-vp-peach',   cat:'juice', name:'Волжский посад Персик-яблоко', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-vp-mors',    cat:'juice', name:'Морс Волжский посад Смородина-брусника-морошка', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-vp-lemonade',cat:'juice', name:'Лимонад Волжский посад Лимон-лайм-мята', price:null, unit:'1 л', desc:'', art:'cup' },
  { id:'j-vp-multi',   cat:'juice', name:'Сок Волжский посад Мультифрукт', price:null, unit:'200 мл', desc:'', art:'cup' },
  { id:'j-vp-apple',   cat:'juice', name:'Сок Волжский посад Яблоко', price:null, unit:'200 мл', desc:'', art:'cup' },
  { id:'j-vp-grape',   cat:'juice', name:'Сок Волжский посад Яблоко-виноград', price:null, unit:'200 мл', desc:'', art:'cup' },
  { id:'j-sp-apricot', cat:'juice', name:'Сок Сады Придонья Яблоко-абрикос', price:null, unit:'200 мл', desc:'Детский, без сахара.', art:'cup' },
  { id:'j-sp-cherry',  cat:'juice', name:'Сок Сады Придонья Яблоко-вишня', price:null, unit:'200 мл', desc:'Детский, без сахара.', art:'cup' },
  { id:'j-sp-peach',   cat:'juice', name:'Сок Сады Придонья Яблоко-персик', price:null, unit:'200 мл', desc:'Детский, без сахара.', art:'cup' },

  { id:'s-cola',   cat:'soda', name:'Добрый Cola', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'s-cola-03' }, { v:'0,5 л', price:null, photo:'s-cola-05' }, { v:'1 л', price:null, photo:'s-cola-1' }] },
  { id:'s-orange', cat:'soda', name:'Добрый Апельсин', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'s-orange-03' }, { v:'0,5 л', price:null, photo:'s-orange-05' }, { v:'1 л', price:null, photo:'s-orange-1' }] },
  { id:'s-lime',   cat:'soda', name:'Добрый Лимон-лайм', desc:'', art:'cup',
    vols:[{ v:'0,3 л', price:null, photo:'s-lime-03' }, { v:'0,5 л', price:null, photo:'s-lime-05' }, { v:'1 л', price:null, photo:'s-lime-1' }] },
  { id:'s-bon-still', cat:'soda', name:'BonAqua негазированная', price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'s-bon-gas',   cat:'soda', name:'BonAqua газированная',   price:null, unit:'0,5 л', desc:'', art:'cup' },

  { id:'c-rich-green', cat:'cold', name:'Rich Зелёный чай',          price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'c-rich-rasp',  cat:'cold', name:'Rich Зелёный чай Малина',   price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'c-rich-mango', cat:'cold', name:'Rich Зелёный чай Манго',    price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'c-rich-lemon', cat:'cold', name:'Rich Чёрный чай Лимон',     price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'c-rich-peach', cat:'cold', name:'Rich Чёрный чай Персик',    price:null, unit:'0,5 л', desc:'', art:'cup' },
  { id:'c-burn-orig',  cat:'cold', name:'Burn Оригинальный',         price:null, unit:'0,45 л', desc:'Энергетический напиток.', art:'cup' },
  { id:'c-burn-juicy', cat:'cold', name:'Burn Сочная энергия',       price:null, unit:'0,45 л', desc:'Энергетический напиток.', art:'cup' },
  { id:'c-burn-trop',  cat:'cold', name:'Burn Тропический микс',     price:null, unit:'0,45 л', desc:'Энергетический напиток.', art:'cup' },
  { id:'c-burn-apple', cat:'cold', name:'Burn Яблоко-киви',          price:null, unit:'0,45 л', desc:'Энергетический напиток.', art:'cup' },

  { id:'m-top-banana',  cat:'milk', name:'Топтыжка Банан',                price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-top-vanilla', cat:'milk', name:'Топтыжка Ванильное мороженое',  price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-top-caramel', cat:'milk', name:'Топтыжка Карамельная ириска',   price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-top-rasp',    cat:'milk', name:'Топтыжка Малина',               price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-top-mango',   cat:'milk', name:'Топтыжка Манго-клубника',       price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-top-choco',   cat:'milk', name:'Топтыжка Шоколадный пломбир с маршмеллоу', price:null, unit:'200 г', desc:'Молочный коктейль.', art:'cup' },
  { id:'m-chudo',       cat:'milk', name:'Чудо Ванильный пломбир',        price:null, unit:'210 г', desc:'Молочный коктейль.', art:'cup' },

  { id:'e-sauce',   cat:'extra', name:'Соус томатный острый',            price:35,  unit:'30 гр',  desc:'Порционный.', art:'sauce' },
  { id:'e-sauceb',  cat:'extra', name:'Соус томатный острый большой',    price:140, unit:'120 гр', desc:'На четыре порции.', art:'sauce' },
  { id:'e-mayo',    cat:'extra', name:'Майонез',                         price:25,  unit:'30 гр',  desc:'Порционный.', art:'sauce' },
  { id:'e-boxs',    cat:'extra', name:'Коробка для пиццы маленькая',     price:35,  unit:'',       desc:'Для заказа навынос.', art:'box' },
  { id:'e-boxm',    cat:'extra', name:'Коробка для пиццы средняя',       price:50,  unit:'',       desc:'Для заказа навынос.', art:'box' },
  { id:'e-boxl',    cat:'extra', name:'Коробка для пиццы большая',       price:70,  unit:'',       desc:'Для заказа навынос.', art:'box' },
  { id:'e-plate',   cat:'extra', name:'Тарелка одноразовая',             price:15,  unit:'',       desc:'', art:'plate' },
  { id:'e-glass',   cat:'extra', name:'Стакан одноразовый',              price:15,  unit:'',       desc:'', art:'cup' },
  { id:'e-bag',     cat:'extra', name:'Пакет-переноска для пиццы',       price:15,  unit:'',       desc:'', art:'bag' },
  { id:'e-cont',    cat:'extra', name:'Контейнер',                       price:20,  unit:'',       desc:'', art:'container' }
];

/* ---------- подробности о доставке и оплате ---------- */
const NOTES = [
  'За 45 минут до закрытия принимаем заказы только кратно 2, 4 и 8 порциям пиццы.',
  'Работаем и доставляем ежедневно с 10:00 до 20:00, без выходных.',
  'Блюда, которых нет в меню, не готовим. Убрать ингредиент по просьбе можем.',
  'Если у вас аллергия, скажите об этом при оформлении заказа.',
  'Отменить или изменить заказ можно, пока пицца не отправилась в печь.'
];

/* ---------- история пиццерии ---------- */
const STORY_INTRO = 'В марте 1993 года у цирка в Нижнем Тагиле открылась первая в городе пиццерия. С того дня и по сей день — тот же адрес, те же рецепты, та же печь.';

const STORY = [
  { year:'1993', title:'Как всё началось',
    text:'У цирка, среди детского смеха и городской суеты, открылась «Пицца» — первая пиццерия Нижнего Тагила. Основатель, Лев Евгеньевич Мордвов, мечтал о месте, где каждый горожанин попробует настоящую пиццу. Для того времени это было событие, изменившее гастрономическую карту города.' },
  { year:'1993', title:'Американская печь и мастер из-за океана',
    text:'Лев Евгеньевич понимал: всё держится на выпечке. Он привёз качественную американскую печь — она стала сердцем заведения — и пригласил из Америки мастера Крейга Нильсона. Тот отладил технологию и привил в Тагиле настоящую культуру пиццы. Та самая печь работает до сих пор.' },
  { year:'2002', title:'Визит губернатора',
    text:'Популярность росла, за пиццей приезжали из соседних городов области. В 2002 году пиццерию посетил губернатор Свердловской области Эдуард Россель — высоко оценил и качество, и слаженную работу коллектива.' },
  { year:'2003', title:'Десять лет: «Пицца, чтобы есть и веселиться»',
    text:'Первый юбилей отметили с размахом: конкурсы, розыгрыши, весёлые ростовые персонажи у входа. К празднику испекли юбилейную пиццу длиной в метр — с маслинами, помидорами, янтарным сыром и зеленью брокколи. Гости расходились с одним настроением: сюда стоит возвращаться.' },
  { year:'2008', title:'Пятнадцать лет',
    text:'Ещё один яркий праздник — с конкурсами, призами и морем гостей. Юбилей стал общим: и для команды пиццерии, и для тех, кто пришёл его отметить.' },
  { year:'2013', title:'Двадцать лет и двухметровая пицца',
    text:'К двадцатилетию приготовили гигантскую двухметровую пиццу. Ноутбуки, планшеты, телевизоры и фирменные пиццы улетали к счастливчикам, а главной интригой вечера стал розыгрыш скутера. Двадцать лет назад всё началось с простой идеи — делать пиццу, которая объединяет людей.' },
  { year:'сегодня', title:'История продолжается',
    text:'Прошли годы, а пицца остаётся такой же, как в первый день: те же ингредиенты, те же рецепты, та же любовь к качеству. Каждый кусочек — как возвращение в 1993-й, когда город впервые попробовал настоящую пиццу. Приходите на Куйбышева, 14 — попробуйте вкус, проверенный временем.' }
];

/* ---------- сторис ---------- */
const STORIES = [
  { title:'Как мы печём', video:'story1.mp4', poster:'story1.jpg' },
  { title:'Тесто вручную', video:'story2.mp4', poster:'story2.jpg' },
  { title:'Сторис 3', c1:'#2F7A4F', c2:'#1D4F35' },
  { title:'Сторис 4', c1:'#F5B43C', c2:'#C2801A' },
  { title:'Сторис 5', c1:'#2B2B33', c2:'#15151A' }
];

const FREE_FROM = 4000;
const DELIVERY  = 300;

const DELIVERY_HOURS = '10:00 — 20:00';

/* тариф по районам: правьте здесь */
const ZONES = [
  { area:'ГГМ',               free:4000, price:250, time:'45 мин' },
  { area:'Голый Камень',      free:4000, price:250, time:'45 мин' },
  { area:'Горбуново',         free:4000, price:250, time:'45 мин' },
  { area:'Кулибина',          free:4000, price:250, time:'45 мин' },
  { area:'25 квартал',        free:4000, price:300, time:'45 мин' },
  { area:'Б. Окуджавы',       free:4000, price:300, time:'45 мин' },
  { area:'Лебяжка',           free:4000, price:300, time:'45 мин' },
  { area:'Пырловка',          free:4000, price:300, time:'45 мин' },
  { area:'Фатеево',           free:4000, price:300, time:'45 мин' },
  { area:'ВМЗ',               free:4000, price:350, time:'45 мин' },
  { area:'Выя',               free:4000, price:350, time:'45 мин' },
  { area:'Красный Камень',    free:4000, price:350, time:'45 мин' },
  { area:'М. Кушва',          free:4000, price:350, time:'45 мин' },
  { area:'Н. Кушва',          free:4000, price:350, time:'45 мин' },
  { area:'Смычка',            free:4000, price:350, time:'45 мин' },
  { area:'Старатель',         free:4000, price:350, time:'45 мин' },
  { area:'Центр (до Серова, до горсовета, до Заводской)', free:3000, price:350, time:'45 мин' },
  { area:'Кирпичный',         free:4000, price:400, time:'45 мин' },
  { area:'Рудник',            free:4000, price:400, time:'45 мин' },
  { area:'Северный',          free:4000, price:400, time:'45 мин' },
  { area:'Тагилстрой',        free:4000, price:400, time:'45 мин' },
  { area:'Вагонка',           free:4000, price:500, time:'45 мин' },
  { area:'Николо-Павловское', free:4000, price:500, time:'90 мин' },
  { area:'Черноисточинск',    free:4000, price:700, time:'90 мин' }
];

/* что предлагаем добавить к заказу */
const UPSELL = ['e-sauce', 'e-mayo', 'd-coffee', 'd-tealem', 'e-sauceb', 'e-boxm'];

/* ---------- утилиты ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/* события для Яндекс.Метрики */
const YM_ID = 111258020;
function ym_goal(name, params) {
  try { if (window.ym) ym(YM_ID, 'reachGoal', name, params || {}); } catch (e) {}
}

const rub = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
const isPizza = p => p.cat === 'pizza';
/* строка корзины для позиции с объёмами: id~номер объёма */
const baseId = id => String(id).split('~')[0];
const byId = id => MENU.find(p => p.id === baseId(id));
const volOf = (p, vi) => p.vols ? p.vols[vi || 0] : null;
const priceOf = (p, vi) => { const v = volOf(p, vi); return v ? v.price : p.price; };
const hasPrice = (p, vi) => priceOf(p, vi) != null;

function seeded(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/* ---------- иллюстрации ---------- */
const TOPPING = {
  pepperoni:(x,y)=>`<circle cx="${x}" cy="${y}" r="9.5" fill="#B02A18" stroke="#17171A" stroke-width="1.6"/><circle cx="${x-3}" cy="${y-2}" r="1.6" fill="#8A1F10"/>`,
  mushroom:(x,y)=>`<path d="M${x-8} ${y} a8 8 0 0 1 16 0 z" fill="#E4D2B4" stroke="#17171A" stroke-width="1.6"/><rect x="${x-3}" y="${y}" width="6" height="7" rx="2" fill="#D3BC97" stroke="#17171A" stroke-width="1.6"/>`,
  olive:(x,y)=>`<circle cx="${x}" cy="${y}" r="6.2" fill="#22242E" stroke="#17171A" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="2.4" fill="#D8C7A9"/>`,
  pepper:(x,y)=>`<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#3E5C34" stroke-width="3.4"/>`,
  ham:(x,y,r)=>`<rect x="${x-8}" y="${y-6}" width="16" height="12" rx="3" fill="#E39A8B" stroke="#17171A" stroke-width="1.6" transform="rotate(${Math.round(r()*90-45)} ${x} ${y})"/>`,
  bacon:(x,y)=>`<path d="M${x-10} ${y-3} q5 6 10 0 q5 -6 10 0" fill="none" stroke="#C0503A" stroke-width="5" stroke-linecap="round"/>`,
  pineapple:(x,y)=>`<circle cx="${x}" cy="${y}" r="7" fill="#E8B93A" stroke="#17171A" stroke-width="1.5"/><path d="M${x-7} ${y} h14 M${x} ${y-7} v14" stroke="#C89A22" stroke-width="1.4"/>`,
  tomato:(x,y)=>`<circle cx="${x}" cy="${y}" r="7.5" fill="#D8543C" stroke="#17171A" stroke-width="1.5"/>`,
  basil:(x,y,r)=>`<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#3E5C34" stroke="#17171A" stroke-width="1.4" transform="rotate(${Math.round(r()*140-70)} ${x} ${y})"/>`,
  cheese:(x,y)=>`<circle cx="${x}" cy="${y}" r="6.5" fill="#EFCF7E" stroke="#17171A" stroke-width="1.3"/>`,
  chili:(x,y,r)=>`<path d="M${x-7} ${y-4} q7 3 12 8" fill="none" stroke="#B02A18" stroke-width="4" stroke-linecap="round" transform="rotate(${Math.round(r()*180)} ${x} ${y})"/>`
};

function pizzaSVG(pizza, opts = {}) {
  const rnd = seeded(pizza.id);
  const n = opts.count || 13;
  const items = [];
  for (let i = 0; i < n; i++) {
    const kind = pizza.top[i % pizza.top.length];
    const a = rnd() * Math.PI * 2;
    const d = 20 + Math.sqrt(rnd()) * 50;
    items.push(TOPPING[kind](100 + Math.cos(a) * d, 100 + Math.sin(a) * d, rnd));
  }
  let crust = '';
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    crust += `<circle cx="${(100 + Math.cos(a) * 88).toFixed(1)}" cy="${(100 + Math.sin(a) * 88).toFixed(1)}" r="8" fill="#D9BE8C"/>`;
  }
  const label = pizza.name ? `role="img" aria-label="${pizza.name}"` : 'aria-hidden="true"';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ${label}>
    <g>${crust}</g>
    <circle cx="100" cy="100" r="88" fill="none" stroke="#17171A" stroke-width="3"/>
    <circle cx="100" cy="100" r="79" fill="#C43823"/>
    <circle cx="100" cy="100" r="74" fill="#EBD9A6" opacity=".93"/>
    ${items.join('')}
  </svg>`;
}

const OTHER_ART = {
  cup:`<path d="M60 62h74l-10 100H70Z" fill="#EFE6D4" stroke="#17171A" stroke-width="3"/><path d="M62 84h70" stroke="#17171A" stroke-width="3"/><path d="M134 92c22-6 26 30 4 32" fill="none" stroke="#17171A" stroke-width="3"/><path d="M78 40c6 8-6 12 0 20M100 36c6 8-6 12 0 20M122 40c6 8-6 12 0 20" fill="none" stroke="#6E6E78" stroke-width="3" stroke-linecap="round"/>`,
  sauce:`<path d="M56 92h88l-10 62a8 8 0 0 1-8 7H74a8 8 0 0 1-8-7Z" fill="#C43823" stroke="#17171A" stroke-width="3"/><ellipse cx="100" cy="92" rx="44" ry="12" fill="#E05A2B" stroke="#17171A" stroke-width="3"/><path d="M84 52h32l4 28H80Z" fill="#EFE6D4" stroke="#17171A" stroke-width="3"/>`,
  box:`<rect x="34" y="66" width="132" height="96" rx="10" fill="#D9BE8C" stroke="#17171A" stroke-width="3"/><path d="M34 92h132" stroke="#17171A" stroke-width="3"/><rect x="76" y="40" width="48" height="30" rx="6" fill="#F5B43C" stroke="#17171A" stroke-width="3"/><circle cx="100" cy="126" r="20" fill="#C43823" stroke="#17171A" stroke-width="3"/>`,
  plate:`<ellipse cx="100" cy="118" rx="72" ry="26" fill="#EFE6D4" stroke="#17171A" stroke-width="3"/><ellipse cx="100" cy="112" rx="50" ry="17" fill="none" stroke="#17171A" stroke-width="2.5" opacity=".45"/><path d="M28 118c0 16 32 28 72 28s72-12 72-28" fill="none" stroke="#17171A" stroke-width="3"/>`,
  bag:`<path d="M52 74h96v88a8 8 0 0 1-8 8H60a8 8 0 0 1-8-8Z" fill="#D9BE8C" stroke="#17171A" stroke-width="3"/><path d="M76 74V56a24 24 0 0 1 48 0v18" fill="none" stroke="#17171A" stroke-width="3"/><circle cx="100" cy="118" r="18" fill="#C43823" stroke="#17171A" stroke-width="3"/>`,
  container:`<path d="M46 84h108l-8 76a8 8 0 0 1-8 7H62a8 8 0 0 1-8-7Z" fill="#EFE6D4" stroke="#17171A" stroke-width="3"/><rect x="38" y="66" width="124" height="20" rx="7" fill="#B9C2D4" stroke="#17171A" stroke-width="3"/><path d="M74 108v40M100 108v40M126 108v40" stroke="#17171A" stroke-width="2" opacity=".35"/>`
};
const otherSVG = p => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}">${OTHER_ART[p.art] || OTHER_ART.box}</svg>`;
/* фото товаров: img/menu/<id>.webp, у пицц для карточек есть лёгкая -sm версия */
const MENU_IMG = 'img/menu/';
const photoOf = (p, vi) => { const v = volOf(p, vi); return v ? v.photo : p.id; };
const artOf = (p, vi, big) => isPizza(p)
  ? `<img class="pizza-photo" src="${MENU_IMG}${p.id}${big ? '' : '-sm'}.webp" alt="${p.name}" loading="lazy" width="${big ? 600 : 360}" height="${big ? 600 : 360}">`
  : `<img class="item-photo" src="${MENU_IMG}${photoOf(p, vi)}.webp" alt="${p.name}" loading="lazy" width="440" height="440">`;

/* ---------- состояние ---------- */
let cart = [];
let openProduct = null, openQty = 1, openVol = 0;
let fulfil = 'delivery', payMethod = 'cash', zoneIdx = 0, payer = 'person';

const save = () => { try { localStorage.setItem('pizza1_cart', JSON.stringify(cart)); } catch {} };
const load = () => { try { cart = JSON.parse(localStorage.getItem('pizza1_cart')) || []; } catch { cart = []; } };
/* сохранённая корзина берёт цены из текущего меню */
const repriceCart = () => { cart.forEach(l => { const p = byId(l.id); const pr = p && priceOf(p, String(l.id).split('~')[1]); if (pr != null) l.price = pr; }); };

/* ---------- витрина ---------- */
function renderStories() {
  $('#stories').innerHTML = STORIES.map((s, i) => s.video
    ? `<button class="story story--video" data-i="${i}" style="background-image:url('${s.poster}')" aria-label="${s.title}">
         <span class="story__play" aria-hidden="true"></span></button>`
    : `<button class="story" data-i="${i}" style="background:linear-gradient(160deg,${s.c1},${s.c2})"><b>${s.title}</b></button>`
  ).join('');
}

function renderTabs() {
  $('#tabs').innerHTML = CATS.map((c, i) =>
    `<button class="tab" role="tab" data-c="${c.id}" aria-selected="${i === 0}">${c.label}</button>`
  ).join('');
}

/* ---------- значки-пометки ---------- */
const TAG_ICON = {
  chili:'<path d="M13.5 4.2c.2-1 1-1.7 2-1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13.2 5.4c3.2.3 5.6 3 5.6 6.2 0 4.1-3.4 7.4-7.5 7.4-3.1 0-5.6-2-5.6-4.6 0-2.1 1.7-3.8 3.8-3.8h1.4a2.3 2.3 0 0 0 2.3-2.3Z" fill="currentColor"/>',
  flame:'<path d="M12 2.5c4.2 4.2 6.3 6.4 6.3 9.4a6.3 6.3 0 0 1-12.6 0c0-3 2.1-5.2 6.3-9.4Z" fill="currentColor"/>',
  leaf:'<path d="M4.5 19.5C4.5 11.2 10.8 4.9 19.1 4.9c0 8.3-6.3 14.6-14.6 14.6Z" fill="currentColor"/><path d="M4.5 19.5 19.1 4.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  star:'<path d="M12 2.8l2.7 5.7 6.2.8-4.6 4.2 1.3 6.1L12 16.6l-5.6 3 1.3-6.1-4.6-4.2 6.2-.8Z" fill="currentColor"/>'
};
const TAGS = {
  'острая':   { icon:'chili', color:'#F0644A' },
  'сытная':   { icon:'flame', color:'#F5B43C' },
  'без мяса': { icon:'leaf',  color:'#7FBF68' },
  'детям':    { icon:'star',  color:'#7C9BF0' },
  'сладкая':  { icon:'star',  color:'#E58BB5' }
};
function badgeHTML(p) {
  if (!p.tag) return '';
  const t = TAGS[p.tag] || { icon:'flame', color:'#F5B43C' };
  return `<span class="badge" style="--bc:${t.color}">
    <svg viewBox="0 0 24 24" aria-hidden="true">${TAG_ICON[t.icon]}</svg>${p.tag}</span>`;
}

function itemPrice(p) {
  const prices = (p.vols ? p.vols.map(v => v.price) : [p.price]).filter(x => x != null);
  const unit = p.vols ? p.vols.map(v => v.v).join(' · ') : p.unit;
  const small = unit ? `<small>${unit}</small>` : '';
  if (!prices.length) return `<span class="price price--tbd">Цена уточняется${small}</span>`;
  return `<span class="price">${prices.length > 1 ? '<i>от</i>' : ''}${rub(Math.min(...prices))}${small}</span>`;
}

function cardHTML(p) {
  return `<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name} — открыть карточку">
      <div class="card__art">${artOf(p)}${badgeHTML(p)}</div>
      <h3>${p.name}</h3>

      <div class="card__buy">
        ${isPizza(p) ? `<span class="price"><i>от</i>${rub(p.price * MIN_SLICES)}<small>за ${MIN_SLICES} порции по ${p.unit}</small><b class="price__whole">целая — ${rub(p.price * 8)}</b></span>` : itemPrice(p)}
        <button class="pill pill--amber" data-add>Выбрать</button>
      </div>
    </article>`;
}

function renderMenu() {
  $('#sections').innerHTML = CATS.map(c => {
    const items = MENU.filter(p => p.cat === c.id);
    if (!items.length) return '';
    return `<section class="catsec" id="cat-${c.id}" data-cat="${c.id}">
      <h2 class="sec">${c.label}</h2>
      <div class="grid">${items.map(cardHTML).join('')}</div>
    </section>`;
  }).join('');
}

/* ---------- карточка товара ---------- */
function openProd(id) {
  const p = byId(id);
  if (!p) return;
  openProduct = p;
  openQty = isPizza(p) ? MIN_SLICES : 1;
  openVol = 0;
  $('#prodArt').innerHTML  = artOf(p, 0, true) + badgeHTML(p);
  $('#prodName').textContent = p.name;
  $('#prodUnit').textContent = p.unit ? `Выход ${p.unit}${isPizza(p) ? ' · тесто пышное' : ''}` : '';
  $('#prodUnit').hidden = !p.unit;
  $('#prodDesc').textContent = p.desc || '';
  $('#prodDesc').hidden = !p.desc;
  renderProdQty();
  $('#prod').hidden = false;
  lockScroll();
  $('#prodAdd').focus();
}

const WHOLE = 8;
const MIN_SLICES = 2;   // минимум — 2 порции
const STEP = 1;         // шаг — одна порция
const stepOf = p => p && p.pair ? 2 : STEP;   // pair: только кратно 2 порциям

function renderProdQty() {
  const p = openProduct;
  if (!p) return;
  const box = $('#prodQty');

  if (isPizza(p)) {
    const half = MIN_SLICES;
    const presets = [MIN_SLICES, 4, WHOLE];
    box.innerHTML = `
      <p class="pmodal__label">Сколько порций — от 2</p>
      <div class="sizes">${presets.map(n =>
        `<button data-n="${n}" aria-pressed="${n === openQty}">${presetName(n)}</button>`).join('')}</div>

      <div class="amount">
        <button class="amount__b" data-d="-1" aria-label="Меньше">−</button>
        <div class="amount__now">
          <b>${sizeName(openQty)}</b>
          <span>${openQty} ${plural(openQty,'порция','порции','порций')} по ${p.unit}</span>
        </div>
        <button class="amount__b" data-d="1" aria-label="Больше">+</button>
      </div>

      <p class="pmodal__hint">${p.pair ? 'Эту пиццу готовим только кратно 2 порциям: 2, 4, 6, 8.' : 'Одного вида — от 2 порций, дальше по одной: можно 3, 5, 7.'} Целая пицца — 8 порций, ${rub(p.price * WHOLE)}.</p>`;
    $('#prodPrice').textContent = rub(p.price * openQty);
  } else {
    box.innerHTML = (p.vols ? `<p class="pmodal__label">Объём</p>
      <div class="sizes">${p.vols.map((v, i) =>
        `<button data-vol="${i}" aria-pressed="${i === openVol}">${v.v}</button>`).join('')}</div>` : '') +
      `<p class="pmodal__label">Количество</p>
      <div class="amount">
        <button class="amount__b" data-d="-1" aria-label="Меньше">−</button>
        <div class="amount__now"><b>${openQty} шт.</b><span>${p.vols ? p.vols[openVol].v : (p.unit || '')}</span></div>
        <button class="amount__b" data-d="1" aria-label="Больше">+</button>
      </div>`;
    $('#prodPrice').textContent = hasPrice(p, openVol) ? rub(priceOf(p, openVol) * openQty) : 'Цена уточняется';
  }
  const can = hasPrice(p, openVol);
  $('#prodAdd').disabled = !can;
  $('#prodAdd').textContent = can ? 'В корзину' : 'Скоро в продаже';
}

function wholeNote(l) {
  const p = byId(l.id);
  if (!p || !isPizza(p)) return '';
  return sizeName(l.qty) + ' · ';
}

function presetName(n) {
  if (n === 4) return 'Половина · 4';
  if (n === 8) return 'Целая · 8';
  return `${n} порции`;
}

function sizeName(slices) {
  const n = Math.max(0, Math.round(slices));
  if (n === 4) return 'Половина пиццы';
  if (n < 8) return `${n} ${plural(n,'порция','порции','порций')}`;
  const w = Math.floor(n / 8), r = n % 8;
  let s = `${w} ${plural(w,'целая','целые','целых')} ${plural(w,'пицца','пиццы','пицц')}`;
  if (r === 4) s += ' и половина';
  else if (r) s += ` и ${r} ${plural(r,'порция','порции','порций')}`;
  return s;
}

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

const closeProd = () => { $('#prod').hidden = true; openProduct = null; unlockScroll(); };

/* ---------- корзина ---------- */
const PROMO_CODE = 'любимаяпицца';
const PROMO_OFF  = 0.10;
let promoOn = false;

const zoneChosen = () => zoneIdx !== null;
const zone = () => ZONES[zoneIdx] || ZONES[0];

const totals = () => {
  const goods = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const pickup = fulfil === 'pickup';
  const z = zone();
  const disc  = 0;
  const promo = promoOn ? Math.round((goods - disc) * PROMO_OFF) : 0;
  const ship  = pickup || goods === 0 || goods >= z.free ? 0 : z.price;
  const slices = pizzaSlices();
  const box = boxPlan(slices).total;
  return { goods, disc, promo, ship, box, slices, free: z.free,
           total: goods - disc - promo + ship + box };
};

/* ---------- стоимость упаковки ---------- */
const BOX_PRICES = { 2: 35, 4: 50, 8: 70 };
const BOX_NAMES  = { 8: 'целая', 4: 'половина', 2: 'малая' };

function boxPlan(slices) {
  const n = Math.max(0, Math.round(slices || 0));
  if (!n) return { total: 0, boxes: [] };
  const sizes = [8, 4, 2], best = [0], pick = [null];
  for (let i = 1; i <= n; i++) {
    best[i] = Infinity;
    for (const sz of sizes) {
      const c = BOX_PRICES[sz] + best[Math.max(0, i - sz)];
      if (c < best[i]) { best[i] = c; pick[i] = sz; }
    }
  }
  const boxes = [];
  let cur = n;
  while (cur > 0) { boxes.push(pick[cur]); cur = Math.max(0, cur - pick[cur]); }
  boxes.sort((a, b) => b - a);
  return { total: best[n], boxes };
}

function boxLabel(slices) {
  return boxPlan(slices).boxes.map(x => BOX_NAMES[x]).join(' + ');
}

function pizzaSlices() {
  return cart.reduce((s, l) => {
    const p = MENU.find(m => m.id === l.id);
    return s + (p && isPizza(p) ? l.qty : 0);
  }, 0);
}

function renderCart() {
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const cc = $('#cartCount');
  if (cc) cc.textContent = count;
  const body = $('#cartBody');

  if (!cart.length) {
    body.innerHTML = orderCardHTML() + `<div class="empty">
      ${OVEN_SVG}
      <p>Печь горячая, а корзина пустая.<br>Выберите пиццу — испечём.</p></div>`;
    $('#cartFoot').innerHTML = `<button class="pill pill--amber" disabled>Оформить заказ</button>`;
    renderOrderChip();
    return;
  }

  body.innerHTML = orderCardHTML() + cart.map((l, i) => `<div class="line" data-i="${i}">
    <div class="line__top">
      <span class="line__name">${l.name}</span>
      <span class="line__sum">${rub(l.price * l.qty)}</span>
    </div>
    <p class="line__meta">${wholeNote(l)}${l.meta}${l.meta ? ' · ' : ''}${rub(l.price)} за шт.</p>
    <div class="line__row">
      <div class="qty">
        <button data-step="-1" aria-label="Убрать одну">−</button>
        <span>${l.qty}</span>
        <button data-step="1" aria-label="Добавить одну">+</button>
      </div>
      <button class="drop" data-drop>убрать</button>
    </div>
  </div>`).join('');

  const inCart = new Set(cart.map(l => l.id));
  const offers = UPSELL.map(byId).filter(p => p && hasPrice(p) && !inCart.has(p.id)).slice(0, 4);
  if (offers.length) {
    body.insertAdjacentHTML('beforeend', `
      <div class="upsell">
        <p class="upsell__title">Добавить к заказу</p>
        <div class="upsell__row">
          ${offers.map(p => `
            <button class="up" data-up="${p.id}">
              <span class="up__art">${artOf(p)}</span>
              <span class="up__name">${p.name}</span>
              <span class="up__price">${rub(p.price)}<i>+</i></span>
            </button>`).join('')}
        </div>
      </div>`);
  }

  const t = totals();
  const left = t.free - t.goods;
  $('#cartFoot').innerHTML = `
    <div class="tot"><span>Позиций (${count})</span><span>${rub(t.goods)}</span></div>
    ${t.box ? `<div class="tot"><span>Упаковка</span><span>${rub(t.box)}</span></div>` : ''}
    <div class="tot"><span>Доставка</span><span class="${t.ship ? '' : 'tot__free'}">${t.ship ? rub(t.ship) : 'бесплатно'}</span></div>
    <div class="tot tot--big"><span>Итого</span><span>${rub(t.total)}</span></div>
    ${fulfil === 'pickup' ? '' : left > 0
      ? `<p class="hint hint--warn">Добавьте ещё на ${rub(left)} — и доставка в район «${zone().area}» станет бесплатной.</p>`
      : `<p class="hint hint--ok">Доставка бесплатная: заказ больше ${rub(t.free)}.</p>`}
    <button class="pill pill--amber" id="checkout">Оформить заказ</button>`;
  renderOrderChip();
}

function addToCart(p, qty, vi) {
  const v = volOf(p, vi);
  if (!hasPrice(p, vi)) return;
  const id = v ? `${p.id}~${vi || 0}` : p.id;
  const meta = isPizza(p) ? `порция ${p.unit}` : (v ? v.v : p.unit);
  const found = cart.find(l => l.id === id);
  if (found) found.qty += qty;
  else cart.push({ id, name: v ? `${p.name} ${v.v}` : p.name, meta, price: priceOf(p, vi), qty });
  save(); renderCart();
  toast(isPizza(p) ? `${p.name} — ${sizeName(qty).toLowerCase()} в корзине` : `${p.name} — в корзине`);
}

/* ---------- панели ---------- */
let _lockY = 0;
function lockScroll() {
  _lockY = window.scrollY;
  document.body.style.top = `-${_lockY}px`;
  document.body.classList.add('no-scroll');
}
function unlockScroll() {
  document.body.classList.remove('no-scroll');
  document.body.style.top = '';
  window.scrollTo(0, _lockY);
}

const openCart = () => {
  if ($('#cartPanel').classList.contains('is-inline')) {
    $('#cartPanel').scrollIntoView({ behavior:'smooth', block:'nearest' });
    return;
  }
  $('#cartPanel').classList.add('is-open');
  $('#scrim').hidden = false;
  lockScroll();
  $('#cartToggle').setAttribute('aria-expanded', 'true');
};
const closeCart = () => {
  $('#cartPanel').classList.remove('is-open');
  $('#scrim').hidden = true;
  unlockScroll();
  $('#cartToggle').setAttribute('aria-expanded', 'false');
};

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => el.classList.add('is-on'));
  toastTimer = setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => { el.hidden = true; }, 450);
  }, 1400);
}

/* ---------- события ---------- */
$('#tabs').addEventListener('click', e => {
  const t = e.target.closest('[data-c]');
  if (!t) return;
  const sec = document.getElementById('cat-' + t.dataset.c);
  if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
});

$('#sections').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card) openProd(card.dataset.id);
});
$('#sections').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.card');
  if (card) { e.preventDefault(); openProd(card.dataset.id); }
});

$('#prodQty').addEventListener('click', e => {
  const n = e.target.closest('[data-n]');
  const d = e.target.closest('[data-d]');
  const vb = e.target.closest('[data-vol]');
  if (vb) {
    openVol = +vb.dataset.vol;
    $('#prodArt').innerHTML = artOf(openProduct, openVol, true) + badgeHTML(openProduct);
  }
  else if (n) openQty = +n.dataset.n;
  else if (d) {
    if (isPizza(openProduct)) {
      openQty = Math.max(MIN_SLICES, Math.min(160, openQty + (+d.dataset.d) * stepOf(openProduct)));
    } else {
      openQty = Math.max(1, Math.min(50, openQty + +d.dataset.d));
    }
  }
  else return;
  renderProdQty();
});

/* ---------- полёт блюда в корзину ---------- */
function spawnEmber(x, y, big) {
  const e = document.createElement('span');
  e.className = 'ember';
  const size = (big ? 12 : 7) + Math.random() * (big ? 20 : 13);
  e.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
  document.body.appendChild(e);
  e.animate([
    { transform:'translate(-50%,-50%) scale(1)',   opacity:.95 },
    { transform:`translate(-50%,-50%) translate(${Math.random()*18-9}px, ${16 + Math.random()*20}px) scale(.15)`, opacity:0 }
  ], { duration: 480 + Math.random() * 260, easing:'ease-out' })
   .onfinish = () => e.remove();
}

const OVEN_SVG = `<svg viewBox="0 0 200 200" class="oven" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Подовая печь">
  <g class="oven__red" fill="none" stroke="#E2481C" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M42 52C48 30 70 15 100 15s52 15 58 37"/>
    <path d="M38 70h124v58H38z"/>
    <path d="M64 128v-24a36 36 0 0 1 72 0v24"/>
    <path d="M46 146l-10 32M154 146l10 32"/>
  </g>
  <g class="oven__red" fill="none" stroke="#E2481C" stroke-width="2.1" opacity=".8">
    <path d="M70.0 128.0L57.0 128.0 M71.5 118.7L59.1 114.7 M75.7 110.4L65.2 102.7 M82.4 103.7L74.7 93.2 M90.7 99.5L86.7 87.1 M100.0 98.0L100.0 85.0 M109.3 99.5L113.3 87.1 M117.6 103.7L125.3 93.2 M124.3 110.4L134.8 102.7 M128.5 118.7L140.9 114.7 M130.0 128.0L143.0 128.0"/>
  </g>
  <g class="oven__amber" fill="none" stroke="#F5B43C" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="24" y="52" width="152" height="17" rx="8.5"/>
    <rect x="24" y="128" width="152" height="17" rx="8.5"/>
    <path d="M56 62v-4M100 62v-4M144 62v-4"/>
    <path d="M62 168h76a8 8 0 0 1 0 16H62a8 8 0 0 1 0-16Z"/>
    <path d="M81 168v16M100 168v16M119 168v16"/>
  </g>
  <g class="oven__flame" fill="none" stroke="#FFD86B" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 120c-12-4-17-17-10-27 0 6 3 9 6 10-4-10 0-21 9-27-1 9 2 13 6 18 5 6 6 13 4 19-2 5-7 8-15 7Z"/>
    <path d="M76 122h48"/>
  </g>
</svg>`;

const FLAME_SVG = `<svg viewBox="0 0 100 145" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="f1" d="M50 145C10 124 6 78 29 47 40 32 46 19 50 1c6 20 14 32 25 48 22 32 17 76-25 96Z" fill="#E2481C"/>
  <path class="f2" d="M50 143C24 126 21 87 38 61c8-12 12-25 14-42 5 18 12 30 18 43 15 27 8 65-20 81Z" fill="#FF9A2E"/>
  <path class="f3" d="M50 138c-15-12-17-38-7-58 5-10 8-21 9-33 5 16 10 27 14 37 8 21-1 44-16 54Z" fill="#FFD86B"/>
  <path class="f4" d="M50 132c-8-8-9-23-4-35 3-6 5-12 6-19 3 10 6 16 8 22 5 13 0 26-10 32Z" fill="#FFF0BC"/>
</svg>`;

function makeFlame(size) {
  const el = document.createElement('div');
  el.className = 'flame';
  el.innerHTML = FLAME_SVG;
  el.style.width  = size + 'px';
  el.style.height = size * 1.45 + 'px';
  document.body.appendChild(el);
  return el;
}

function trailFire(ghost, anim) {
  const r0 = ghost.getBoundingClientRect();
  const flame = makeFlame(Math.max(r0.width * 0.42, 26));
  flame.style.opacity = '0';
  let last = 0, px = null, py = null, angle = 0;

  const step = ts => {
    if (anim.playState !== 'running') { flame.remove(); return; }
    const r = ghost.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    // хвост пламени разворачивается против движения
    if (px !== null) {
      const vx = cx - px, vy = cy - py;
      if (Math.hypot(vx, vy) > 0.6) {
        angle = Math.atan2(-vx, vy) * 180 / Math.PI;
        flame.style.opacity = '';
      }
    }
    px = cx; py = cy;

    // минус: сдвигаем против движения, чтобы хвост шёл позади пиццы
    const back = r.width * 0.55 + flame.offsetHeight * 0.45;
    flame.style.transform =
      `translate(-50%,-50%) translate(${cx}px, ${cy}px) rotate(${angle}deg) translateY(${-back}px)`;

    if (ts - last > 22) {
      last = ts;
      const spread = Math.max(r.width, 34);
      spawnEmber(cx + (Math.random() - .5) * spread * .8, cy + (Math.random() - .5) * spread * .8);
      if (Math.random() > .5)
        spawnEmber(cx + (Math.random() - .5) * spread, cy + (Math.random() - .5) * spread * .7);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function flyToCart(sourceEl, spicy) {
  const panel = $('#cartPanel');
  const inline = panel && panel.classList.contains('is-inline');
  const target = inline ? panel : $('#cartToggle');
  const svg = sourceEl && sourceEl.querySelector('img, svg');
  if (!svg || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const s = svg.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  const ghost = document.createElement('div');
  ghost.className = 'fly';
  ghost.innerHTML = svg.outerHTML;
  ghost.style.left   = s.left + 'px';
  ghost.style.top    = s.top + 'px';
  ghost.style.width  = s.width + 'px';
  ghost.style.height = s.height + 'px';
  document.body.appendChild(ghost);

  const dx = (t.left + t.width / 2) - (s.left + s.width / 2);
  const dy = (t.top + t.height / 2) - (s.top + s.height / 2);

  if (spicy) ghost.classList.add('is-spicy');

  const anim = ghost.animate([
    { transform:'translate(0,0) scale(1) rotate(0deg)',                          opacity:1 },
    { transform:`translate(${dx*.45}px, ${dy*.45 - 130}px) scale(.55) rotate(140deg)`, opacity:.95, offset:.55 },
    { transform:`translate(${dx}px, ${dy}px) scale(.08) rotate(320deg)`,         opacity:.2 }
  ], { duration: spicy ? 2300 : 760, easing:'cubic-bezier(.35,.02,.5,1)' });

  if (spicy) trailFire(ghost, anim);

  anim.onfinish = () => {
    ghost.remove();
    const hit = inline ? 'is-hit' : 'is-bump';
    target.classList.remove(hit);
    void target.offsetWidth;
    target.classList.add(hit);
    setTimeout(() => target.classList.remove(hit), 700);
  };
}

$('#prodAdd').addEventListener('click', () => {
  if (!openProduct || !hasPrice(openProduct, openVol)) return;
  const art = $('#prodArt');
  const spicy = openProduct.tag === 'острая';
  const p = openProduct;
  const q = openQty, vi = openVol;
  flyToCart(art, spicy);
  closeProd();
  addToCart(p, q, vi);
  ym_goal('add_to_cart', { item: p.name, qty: q, sum: priceOf(p, vi) * q });
});
$('#prodClose').addEventListener('click', closeProd);
$('#prod').addEventListener('click', e => { if (e.target.id === 'prod') closeProd(); });

$('#cartBody').addEventListener('click', e => {
  const up = e.target.closest('[data-up]');
  if (up) {
    const p = byId(up.dataset.up);
    if (p) addToCart(p, 1);
    return;
  }
  const line = e.target.closest('.line');
  if (!line) return;
  const i = +line.dataset.i;
  const step = e.target.closest('[data-step]');
  if (step) {
    const _p = byId(cart[i].id);
    const _min = _p && isPizza(_p) ? MIN_SLICES : 1;
    cart[i].qty += +step.dataset.step * (_p && isPizza(_p) ? stepOf(_p) : 1);
    if (cart[i].qty < _min) cart.splice(i, 1);
  } else if (e.target.closest('[data-drop]')) {
    cart.splice(i, 1);
  } else return;
  save(); renderCart();
});

$('#cartFoot').addEventListener('click', e => {
  if (e.target.id === 'checkout') { openCheckout(); }
});

$('#stories').addEventListener('click', e => {
  const btn = e.target.closest('.story');
  if (!btn) return;
  const item = STORIES[+btn.dataset.i];
  if (item && item.video) openViewer(item);
  else toast('Эта сторис пока пустая — наполним позже');
});

function openViewer(item) {
  const v = $('#viewerVideo');
  $('#viewerTitle').textContent = item.title;
  v.src = item.video;
  v.poster = item.poster || '';
  v.currentTime = 0;
  $('#viewer').hidden = false;
  lockScroll();
  v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
}

function closeViewer() {
  const v = $('#viewerVideo');
  v.pause();
  v.removeAttribute('src');
  v.load();
  $('#viewer').hidden = true;
  $('#viewerBar').style.width = '0%';
  unlockScroll();
}

$('#viewerClose').addEventListener('click', closeViewer);
$('#viewer').addEventListener('click', e => { if (e.target.id === 'viewer') closeViewer(); });
$('#viewerVideo').addEventListener('timeupdate', e => {
  const v = e.target;
  if (v.duration) $('#viewerBar').style.width = (v.currentTime / v.duration * 100) + '%';
});
$('#viewerVideo').addEventListener('ended', closeViewer);

$('#cartToggle').addEventListener('click', () => {
    if ($('#cartToggle').classList.contains('is-order') && order) {
      ym_goal('order_status_open');
      location.href = order.url;
      return;
    }
    $('#cartPanel').classList.contains('is-open') ? closeCart() : openCart();
  });
$('#cartClose').addEventListener('click', closeCart);
$('#scrim').addEventListener('click', closeCart);
/* ---------- политика конфиденциальности ---------- */
const POLICY = {
  org: 'ИП Мордвов Лев Евгеньевич',
  inn: '[ИНН]',
  ogrnip: '[ОГРНИП]',
  email: '[e-mail для обращений]',
  updated: '[дата последнего обновления]',
  sections: [
    { h: '1. Общие положения',
      p: ['Настоящая Политика конфиденциальности (далее — Политика) действует в отношении всей информации, которую сайт pizza1nt.ru (далее — Сайт) может получить о Пользователе во время использования Сайта.',
          'Оператором персональных данных является [ORG], ИНН [INN], ОГРНИП [OGRNIP] (далее — Оператор).',
          'Используя Сайт, Пользователь выражает согласие с условиями настоящей Политики. В случае несогласия Пользователь обязан воздержаться от использования Сайта.'] },
    { h: '2. Какие данные мы собираем',
      p: ['При оформлении заказа Пользователь предоставляет: имя, номер телефона, адрес доставки. Для заказов на юридическое лицо дополнительно — наименование организации, ИНН, адрес электронной почты.',
          'Автоматически при посещении Сайта собираются технические данные: тип устройства и браузера, а также сведения, сохраняемые в файлах cookie (см. раздел 6).'] },
    { h: '3. Цели обработки данных',
      p: ['Данные обрабатываются исключительно для приёма и выполнения заказа: связи с Пользователем, уточнения деталей, доставки, а для юридических лиц — выставления счёта и оформления документов.',
          'Оператор не использует данные для рассылок и не передаёт их третьим лицам, за исключением случаев, необходимых для доставки заказа или предусмотренных законодательством РФ.'] },
    { h: '4. Хранение и защита данных',
      p: ['Состав корзины хранится локально в браузере Пользователя и не передаётся Оператору до момента оформления заказа.',
          'Оператор принимает разумные организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, раскрытия или уничтожения.',
          'Данные хранятся не дольше, чем этого требуют цели обработки и законодательство РФ.'] },
    { h: '5. Права Пользователя',
      p: ['Пользователь вправе запросить сведения об обработке своих данных, потребовать их уточнения, блокирования или удаления, а также отозвать согласие на обработку.',
          'Для реализации своих прав Пользователь может обратиться к Оператору по адресу: [EMAIL].'] },
    { h: '6. Файлы cookie',
      p: ['Сайт использует файлы cookie и аналогичные технологии для корректной работы интерфейса и сохранения состава корзины.',
          'Пользователь может отключить cookie в настройках браузера, однако это может ограничить работу отдельных функций Сайта.'] },
    { h: '7. Аналитика и сторонние сервисы',
      p: ['Сайт использует сервис веб-аналитики Яндекс.Метрика, принадлежащий ООО «ЯНДЕКС». Сервис собирает обезличенные сведения о посещениях: источник перехода, тип устройства и браузера, просмотренные разделы, время на сайте.',
          'Метрика применяет технологию записи действий посетителя на странице (Вебвизор): фиксируются перемещения курсора, нажатия и прокрутка. Содержимое полей форм — имя, телефон, адрес, реквизиты организации — от записи скрыто и Оператору в записях недоступно.',
          'Обработка данных сервисом осуществляется на условиях, размещённых на сайте Яндекса. Отказаться от сбора данных Метрикой можно, отключив cookie в настройках браузера или воспользовавшись официальным блокировщиком Яндекса.'] },
    { h: '8. Изменения Политики',
      p: ['Оператор вправе вносить изменения в настоящую Политику. Актуальная редакция всегда размещена на этой странице.',
          'Дата последнего обновления: [UPDATED].'] }
  ]
};

function renderPolicy() {
  const fill = str => str
    .replace('[ORG]', POLICY.org).replace('[INN]', POLICY.inn)
    .replace('[OGRNIP]', POLICY.ogrnip).replace('[EMAIL]', POLICY.email)
    .replace('[UPDATED]', POLICY.updated);
  $('#policyBody').innerHTML = `
    <div class="policy__wrap">
      <p class="policy__eyebrow">${POLICY.org}</p>
      <h1 class="policy__h1">Политика конфиденциальности</h1>
      ${POLICY.sections.map(sec => `
        <section class="policy__sec">
          <h2>${sec.h}</h2>
          ${sec.p.map(x => `<p>${fill(x)}</p>`).join('')}
        </section>`).join('')}
    </div>`;
}

let policyScrollY = 0;
function openPolicy() {
  policyScrollY = window.scrollY;
  renderPolicy();
  $('#policy').hidden = false;
  lockScroll();
  window.scrollTo(0, 0);
}
function closePolicy() {
  $('#policy').hidden = true;
  unlockScroll();
}

document.addEventListener('click', e => {
  const link = e.target.closest('a[href="#policy"]');
  if (!link) return;
  e.preventDefault();
  openPolicy();
});

(function initCookie(){
  const box = $('#cookie');
  if (!box) return;
  try { if (localStorage.getItem('cookieOk')) { box.remove(); return; } } catch(e){}
  const ok = $('#cookieOk');
  if (ok) ok.addEventListener('click', () => {
    try { localStorage.setItem('cookieOk','1'); } catch(e){}
    box.remove();
  });
})();
$('#loginBtn').addEventListener('click', () => toast('Вход появится вместе с бэкендом'));

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#viewer').hidden) closeViewer();
  else if (!$('#prod').hidden) closeProd();
  else if (!$('#checkoutBlock').hidden) closeCheckout();
  else closeCart();
});

const PAY_LABEL = { sbp:'СБП', card:'картой онлайн', cash:'при получении' };

function renderModalSum() {
  const t = totals();
  const sel = $('#fZone');
  if (!sel.options.length) {
    sel.innerHTML = '<option value="">— выберите район —</option>' +
      ZONES.map((z, i) => `<option value="${i}">${z.area}</option>`).join('');
    sel.value = zoneChosen() ? zoneIdx : '';
  }
  $('#zoneField').style.display = fulfil === 'pickup' ? 'none' : '';
  $('#zoneHint').textContent = fulfil === 'pickup' ? ''
    : !zoneChosen() ? 'Выберите район — посчитаем стоимость доставки.'
    : `Доставка ${rub(zone().price)}, бесплатно от ${rub(zone().free)}. В пути около ${zone().time}.`;
  $('#pickupInfo').hidden = fulfil !== 'pickup';
  if (fulfil === 'pickup')
    $('#pickupInfo').textContent = `Забрать: ${SHOP.city}, ${SHOP.address}. Заказ будет готов через 15 минут.`;
  $('#addrField').style.display = fulfil === 'pickup' ? 'none' : '';
  $('#modalSum').innerHTML = `
    ${t.promo ? `<div class="tot"><span>Промокод «${PROMO_CODE}»</span><span class="tot__free">−${rub(t.promo)}</span></div>` : ''}
    ${t.box ? `<div class="tot"><span>Упаковка</span><span>${rub(t.box)}</span></div>` : ''}
    ${t.ship ? `<div class="tot"><span>Доставка</span><span>${rub(t.ship)}</span></div>` : ''}
    <div class="tot tot--big"><span>К оплате</span><span>${rub(t.total)}</span></div>
    ${payMethod !== 'cash' ? '<p class="hint">Онлайн-оплата в тестовом режиме: деньги не списываются.</p>' : ''}`;
}

$('#fulfil').addEventListener('click', e => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  fulfil = b.dataset.f;
  $$('[data-f]', $('#fulfil')).forEach(x => x.setAttribute('aria-pressed', x === b));
  renderModalSum(); renderCart();
});

$('#payer').addEventListener('click', e => {
  const b = e.target.closest('[data-payer]');
  if (!b) return;
  payer = b.dataset.payer;
  $$('[data-payer]', $('#payer')).forEach(x => x.setAttribute('aria-pressed', x === b));
  $('#companyFields').hidden = payer !== 'company';
  renderModalSum();
});

$('#fZone').addEventListener('change', e => {
  zoneIdx = e.target.value === '' ? null : +e.target.value;
  renderModalSum(); renderCart();
});

$('#fPromo').addEventListener('input', e => {
  const ok = e.target.value.trim().toLowerCase() === PROMO_CODE;
  if (ok !== promoOn) { promoOn = ok; renderCart(); }
  $('#promoHint').textContent = e.target.value.trim() === '' ? ''
    : ok ? `Промокод принят — скидка ${PROMO_OFF * 100}%` : 'Такого промокода нет';
  $('#promoHint').style.color = ok ? 'var(--basil)' : 'var(--muted)';
  renderModalSum();
});

$('#payOpts').addEventListener('click', e => {
  const b = e.target.closest('[data-p]');
  if (!b) return;
  payMethod = b.dataset.p;
  $$('[data-p]', $('#payOpts')).forEach(x => x.setAttribute('aria-pressed', x === b));
  renderModalSum();
});

function openCheckout() {
  const t = totals();
  ym_goal('checkout_open', { sum: t.total });
  const n = cart.reduce((a, l) => a + l.qty, 0);
  $('#cartRecap').textContent = `${n} поз. на ${rub(t.goods)} — заполните данные, и мы начнём печь.`;
  renderModalSum();
  $('#checkoutBlock').hidden = false;
  $('#cartPanel').classList.add('is-checkout');
  $('#fName').focus();
}
function closeCheckout() {
  $('#checkoutBlock').hidden = true;
  $('#cartPanel').classList.remove('is-checkout');
}
$('#modalCancel').addEventListener('click', closeCheckout);
$('#modalSubmit').addEventListener('click', () => {
  const name  = $('#fName').value.trim();
  const phone = $('#fPhone').value.replace(/\D/g, '');
  const addr  = $('#fAddr').value.trim();
  const err   = $('#modalErr');
  const needAddr = fulfil === 'delivery';
  if (needAddr && !zoneChosen()) {
    err.textContent = 'Выберите район доставки — от него зависит стоимость.';
    err.hidden = false;
    return;
  }
  if (!name || phone.length < 10 || (needAddr && !addr)) {
    err.textContent = needAddr
      ? 'Заполните имя, телефон (от 10 цифр) и адрес — иначе курьер не доедет.'
      : 'Заполните имя и телефон (от 10 цифр).';
    err.hidden = false;
    return;
  }
  if (payer === 'company') {
    const inn = $('#fInn').value.replace(/\D/g, '');
    if (!$('#fCompany').value.trim() || (inn.length !== 10 && inn.length !== 12) || !$('#fEmail').value.includes('@')) {
      err.textContent = 'Для юрлица нужны название, ИНН из 10 или 12 цифр и e-mail для счёта.';
      err.hidden = false;
      return;
    }
  }
  err.hidden = true;

  const t   = totals();
  const sum = rub(t.total);
  const pay = PAY_LABEL[payMethod] + (payMethod !== 'cash' ? ', тест' : '');
  const btn = $('#modalSubmit');
  const wasText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Отправляем…';

  const payload = {
    items: cart.map(l => ({ name: l.name, qty: l.qty, sum: l.price * l.qty, pizza: !!(byId(l.id) && isPizza(byId(l.id))) })),
    box: t.box, box_label: boxLabel(t.slices), slices: t.slices,
    total: t.total, ship: t.ship, disc: t.disc,
    name, phone: $('#fPhone').value.trim(), addr,
    zone: fulfil === 'delivery' && zoneChosen() ? zone().area : '',
    fulfil, payer,
    pay: PAY_LABEL[payMethod],
    company: payer === 'company' ? $('#fCompany').value.trim() : '',
    inn:     payer === 'company' ? $('#fInn').value.trim() : '',
    email:   payer === 'company' ? $('#fEmail').value.trim() : ''
  };

  fetch('order.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(res => {
    if (!res.ok) throw new Error(res.error || 'fail');
    ym_goal('order_done', {
      order_id: res.no || 0, sum: t.total,
      fulfil: fulfil === 'pickup' ? 'самовывоз' : 'доставка',
      zone: fulfil === 'delivery' && zoneChosen() ? zone().area : '',
      payer: payer === 'company' ? 'юрлицо' : 'частное лицо'
    });
    cart = []; save(); rememberOrder(res); renderCart();
    closeCheckout();
    closeCart();
    if (res.url) { setTimeout(() => { location.href = res.url; }, 1400); }
    toast(payer === 'company'
      ? `Заявка на ${sum} принята. Счёт отправим на почту, детали уточним по телефону.`
      : fulfil === 'pickup'
        ? `Заказ на ${sum} принят (${pay}). Заберёте через 15 минут!`
        : `Заказ на ${sum} принят (${pay}). Везём в «${zone().area}»!`);
  })
  .catch(() => {
    err.textContent = 'Не получилось отправить заказ. Позвоните нам: ' + SHOP.phone;
    err.hidden = false;
  })
  .finally(() => {
    btn.disabled = false;
    btn.textContent = wasText;
  });
});

/* ---------- подсветка раздела при прокрутке ---------- */
function initScrollSpy() {
  const strip = $('#tabs');
  const tabs  = $$('[data-c]', strip);
  const secs  = CATS.map(c => document.getElementById('cat-' + c.id)).filter(Boolean);
  if (!secs.length) return;
  let current = null, ticking = false;

  const update = () => {
    ticking = false;
    const line = strip.getBoundingClientRect().bottom + 24;
    let active = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= line) active = s;
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
      active = secs[secs.length - 1];
    const id = active.dataset.cat;
    if (id === current) return;
    current = id;
    tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.c === id));
    const tab = tabs.find(t => t.dataset.c === id);
    if (tab) strip.scrollTo({
      left: tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2,
      behavior: 'smooth'
    });
  };
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ---------- мобильное меню ---------- */
function initDrawer() {
  const drawer = $('#drawer');
  const scrim  = $('#drawerScrim');
  const btn    = $('#burgerBtn');
  if (!drawer || !btn) return;
  const open  = () => { drawer.classList.add('is-open'); scrim.hidden = false;
                        btn.setAttribute('aria-expanded','true');  btn.classList.add('is-x');
                        lockScroll(); };
  const close = () => { drawer.classList.remove('is-open'); scrim.hidden = true;
                        btn.setAttribute('aria-expanded','false'); btn.classList.remove('is-x');
                        unlockScroll(); };
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    drawer.classList.contains('is-open') ? close() : open();
  });
  $('#drawerClose').addEventListener('click', close);
  scrim.addEventListener('click', close);
  drawer.addEventListener('click', e => { if (e.target.closest('a[href^="#"]')) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
}

/* ---------- значки в шапке появляются при прокрутке ---------- */
function initHeadIcons() {
  const head = $('.head');
  const nav  = $('.topnav');
  if (!head) return;
  let ticking = false;
  const apply = () => {
    ticking = false;
    const limit = nav ? nav.offsetHeight - 6 : 42;
    head.classList.toggle('is-stuck', window.scrollY > limit);
  };
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(apply); };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  apply();
}

/* ---------- высота липких полос ---------- */
function trackHeadHeight() {
  const head = $('.head');
  const tabs = $('#tabs');
  if (!head) return;
  const apply = () => {
    const root = document.documentElement.style;
    root.setProperty('--head-h', head.offsetHeight + 'px');
    if (tabs) root.setProperty('--tabs-h', tabs.offsetHeight + 'px');
  };
  apply();
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(apply);
    ro.observe(head);
    if (tabs) ro.observe(tabs);
  }
  window.addEventListener('resize', apply);
  window.addEventListener('load', apply);
}


/* ---------- иконки строки контактов ---------- */
const NAV_ICON = {
  pin:'<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  phone:'<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  car:'<path d="M5 12.5 6.6 8a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 12.5"/><path d="M4.5 12.5h15a1 1 0 0 1 1 1V17h-2.2M4.5 12.5a1 1 0 0 0-1 1V17h2.2M8.6 17h6.8"/><circle cx="7.3" cy="17" r="1.6"/><circle cx="16.7" cy="17" r="1.6"/>'
};
const navIcon = n => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICON[n]}</svg>`;

/* ---------- данные заведения ---------- */
function renderStory() {
  $('#storyBody').innerHTML = `
    <div class="story__hero">
      <p class="story__eyebrow">Первая пиццерия в Нижнем Тагиле</p>
      <h1 class="story__h1">С 1993 года<br>у цирка на Куйбышева</h1>
      <p class="story__lead">${STORY_INTRO}</p>
      <div class="story__oven">${OVEN_SVG}</div>
    </div>
    <div class="timeline">
      ${STORY.map((e, i) => `
        <div class="tl" data-reveal>
          <div class="tl__year"><span>${e.year}</span></div>
          <div class="tl__card">
            <h3>${e.title}</h3>
            <p>${e.text}</p>
          </div>
        </div>`).join('')}
    </div>
    <div class="story__cta">
      <p>Та же печь. Те же рецепты.</p>
      <button class="pill pill--amber" id="storyToMenu">Заказать пиццу</button>
    </div>`;
  $('#storyToMenu').addEventListener('click', () => { closeStory(); });
  initReveal();
}

let storyScrollY = 0;
function openStory() {
  storyScrollY = window.scrollY;
  renderStory();
  $('#story').hidden = false;
  lockScroll();
  window.scrollTo(0, 0);
  if (history.replaceState) history.replaceState(null, '', '#story');
}
function closeStory() {
  $('#story').hidden = true;
  unlockScroll();
  window.scrollTo(0, storyScrollY);
  if (history.replaceState) history.replaceState(null, '', location.pathname);
}

function renderShop() {
  const digits = SHOP.phone.replace(/\D/g, '');
  const tel = '+' + (digits.length === 11 && digits[0] === '8' ? '7' + digits.slice(1) : digits);
  document.title = `${SHOP.name} — доставка пиццы, ${SHOP.city}`;
  $('#shopName').textContent     = SHOP.name;
  $('#shopTagline').textContent  = SHOP.tagline;
  $('#shopCity').textContent     = SHOP.city;
  $('#shopEta').textContent      = SHOP.eta;
  $('#shopRating').textContent   = SHOP.rating;
  $('#shopAddr').textContent     = `${SHOP.city}, ${SHOP.address}`;
  $('#shopDistrict').textContent = SHOP.district;
  $('#shopHours').innerHTML      = `${SHOP.hours} · <a href="tel:${tel}">${SHOP.phone}</a>`;
  $('#shopNote').textContent     = SHOP.pickupNote;
  $('#navInfo').innerHTML = `
    <a href="#where">${navIcon('pin')}${SHOP.address}</a>
    <a href="tel:${tel}">${navIcon('phone')}${SHOP.phone}</a>
    <span>${navIcon('clock')}${SHOP.hours}</span>`;
  const full = `${SHOP.city}, ${SHOP.address}`;
  const mapUrl = SHOP.mapUrl || ('https://yandex.ru/maps/?rtext=~' + encodeURIComponent(full) + '&rtt=auto');
  const C = SHOP.mapCoords || '59.941992,57.887997';
  const mapSrc = SHOP.mapEmbed
    || 'https://yandex.ru/map-widget/v1/?ll=' + C + '&z=17&pt=' + C + ',pm2rdm';
  $('#whereMap').innerHTML = `
    <iframe src="${mapSrc}" loading="lazy" allowfullscreen title="Карта: ${full}"></iframe>
    <a class="where__pin" href="${SHOP.mapUrl || mapSrc}" target="_blank" rel="noopener">
      ${navIcon('pin')}<span>${SHOP.address}</span></a>`;

  $('#headIcons').innerHTML = `
    <div class="hicon">
      <button class="hicon__btn" aria-label="Адрес пиццерии">${navIcon('pin')}</button>
      <div class="hicon__pop">
        <p class="hicon__val">${full}</p>
        <p class="hicon__sub">${SHOP.district}</p>
        <a class="hicon__act" href="${mapUrl}" target="_blank" rel="noopener">Проложить маршрут</a>
      </div>
    </div>
    <div class="hicon">
      <button class="hicon__btn" aria-label="Телефон">${navIcon('phone')}</button>
      <div class="hicon__pop">
        <p class="hicon__val">${SHOP.phone}</p>
        <p class="hicon__sub">Приём заказов в часы работы</p>
        <a class="hicon__act" href="tel:${tel}">Позвонить</a>
      </div>
    </div>
    <div class="hicon">
      <button class="hicon__btn" aria-label="Часы работы">${navIcon('clock')}</button>
      <div class="hicon__pop">
        <p class="hicon__val">${SHOP.hours}</p>
        <p class="hicon__sub">${SHOP.pickupNote}</p>
      </div>
    </div>`;
  $('#mobIcons').innerHTML = `
    <a class="mob-ic" href="${SHOP.mapUrl || '#where'}" target="_blank" rel="noopener" aria-label="Проложить маршрут">${navIcon('car')}</a>
    <a class="mob-ic" href="tel:${tel}" aria-label="Позвонить">${navIcon('phone')}</a>
    <button class="mob-ic" id="mobClock" aria-label="Часы работы">${navIcon('clock')}</button>`;
  $('#mobClock').addEventListener('click', () => toast(SHOP.hours));
  $('#drawerInfo').innerHTML = `
    <a class="drawer__addr" href="${SHOP.mapUrl || '#where'}" target="_blank" rel="noopener">${navIcon('pin')}${full}</a>
    <a href="tel:${tel}">${navIcon('phone')}${SHOP.phone}</a>
    <span>${navIcon('clock')}${SHOP.hours}</span>`;
  $('#deliveryLead').textContent =
    `Возим по ${SHOP.city} каждый день с 10:00 до 20:00. Ниже — всё, что стоит знать до заказа.`;
  $('#deliveryFaq').innerHTML = `
    <div class="dstats" data-reveal>
      <div class="dstat dstat--ok"><b>от ${rub(3000)}</b><span>бесплатная доставка в Центр</span></div>
      <div class="dstat dstat--ok"><b>от ${rub(4000)}</b><span>бесплатно в остальные районы</span></div>
      <div class="dstat dstat--pay"><b>${rub(200)}–${rub(400)}</b><span>стоимость доставки по тарифу района</span></div>
      <div class="dstat"><b>${DELIVERY_HOURS}</b><span>работаем и возим, без выходных</span></div>
    </div>

    <div class="dblock" data-reveal>
      <h3>Чем заплатить</h3>
      <div class="pays">
        <div class="pay"><span class="pay__ic">${navIcon('car')}</span>
          <b>При доставке</b><span>Курьеру наличными или банковской картой</span>
          <em class="pay__tag pay__tag--ok">работает</em></div>
        <div class="pay"><span class="pay__ic">${navIcon('pin')}</span>
          <b>При самовывозе</b><span>На кассе наличными или банковской картой</span>
          <em class="pay__tag pay__tag--ok">работает</em></div>
        <div class="pay"><span class="pay__ic">${navIcon('phone')}</span>
          <b>Онлайн: СБП и карта</b><span>QR-код в приложении банка или оплата картой на сайте</span>
          <em class="pay__tag">тест</em></div>
      </div>
    </div>

    <div class="dblock" data-reveal>
      <h3>Стоимость доставки по районам</h3>
      <p class="dsub">Возим в любой район ${SHOP.city} с ${DELIVERY_HOURS}. Найдите свой район в списке.</p>
      <input class="zsearch" id="zoneSearch" type="search" placeholder="Начните вводить район — например, ГГМ" aria-label="Поиск района">
      <div class="ztable__wrap">
        <table class="ztable">
          <thead><tr><th>Район</th><th>Бесплатно от</th><th>Доставка</th><th>В пути</th></tr></thead>
          <tbody id="zoneRows">${ZONES.map(z => `<tr data-area="${z.area.toLowerCase()}">
            <td class="ztable__area">${z.area}</td>
            <td class="ztable__free" data-l="Бесплатно от">${rub(z.free)}</td>
            <td class="ztable__price" data-l="Доставка">${rub(z.price)}</td>
            <td class="ztable__time" data-l="В пути">${z.time}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="dnote dnote--empty" id="zoneEmpty" hidden>Такой район не нашёлся. Позвоните — обсудим доставку отдельно.</p>
    </div>

    <div class="dblock" data-reveal>
      <h3>Что важно знать</h3>
      <ul class="dnotes">${NOTES.map(n => `<li>${n}</li>`).join('')}</ul>
    </div>`;

  $('#zoneSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    $$('#zoneRows tr').forEach(tr => {
      const ok = !q || tr.dataset.area.includes(q);
      tr.hidden = !ok;
      if (ok) shown++;
    });
    $('#zoneEmpty').hidden = shown > 0;
  });
  $('#footName').textContent     = SHOP.name;
  $('#brandLink').setAttribute('aria-label', SHOP.name);
}
/* ---------- текущий заказ: статус вместо корзины ---------- */
const ORDER_LS = 'pizza1_order';
const ORDER_LABEL = { new:'Принят', accepted:'Подтверждён', cooking:'Готовится',
  delivering:'Курьер в пути', ready:'Готов к выдаче', done:'Доставлен', cancelled:'Отменён' };
const ORDER_TTL_ACTIVE = 24 * 3600 * 1000; // заказ не старше суток
const ORDER_TTL_FINAL = 2 * 3600 * 1000;   // после выдачи показываем ещё два часа
let order = null, orderTimer = null, cartToggleHTML = '';

const orderSave = () => {
  try { order ? localStorage.setItem(ORDER_LS, JSON.stringify(order)) : localStorage.removeItem(ORDER_LS); } catch {}
};
const orderLoad = () => {
  try { order = JSON.parse(localStorage.getItem(ORDER_LS)) || null; } catch { order = null; }
  if (order && (!order.key || !order.url)) order = null;
};

function orderExpired() {
  if (!order) return true;
  const now = Date.now();
  if (now - (order.created || 0) > ORDER_TTL_ACTIVE) return true;
  if (order.final && now - (order.finalAt || 0) > ORDER_TTL_FINAL) return true;
  return false;
}

function rememberOrder(res) {
  let key = '';
  try { key = new URL(res.url, location.href).searchParams.get('k') || ''; } catch {}
  if (!key) return;
  order = { key, no: res.no || 0, url: res.url, status: 'new', label: ORDER_LABEL.new,
    created: Date.now(), final: false, finalAt: 0 };
  orderSave();
  renderOrderChip();
  scheduleOrderPoll(20000);
}

function clearOrder() {
  order = null; orderSave();
  clearTimeout(orderTimer);
  renderOrderChip();
}

function scheduleOrderPoll(ms) {
  clearTimeout(orderTimer);
  if (!order || order.final) return;
  orderTimer = setTimeout(pollOrder, ms);
}

function pollOrder() {
  if (!order || orderExpired()) { clearOrder(); renderCart(); return; }
  if (document.hidden) { scheduleOrderPoll(30000); return; }
  fetch('order_status.php?k=' + encodeURIComponent(order.key), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => {
      if (!d.ok) throw new Error('no');
      const changed = d.status !== order.status;
      order.status = d.status;
      order.label = d.label || ORDER_LABEL[d.status] || d.status;
      if (d.no) order.no = d.no;
      if (d.final && !order.final) { order.final = true; order.finalAt = Date.now(); }
      orderSave();
      renderOrderChip();
      if (changed) {
        renderCart();
        toast(`Заказ №${order.no}: ${order.label.toLowerCase()}`);
      }
      scheduleOrderPoll(30000);
    })
    .catch(e => {
      if (e === 404) { clearOrder(); renderCart(); return; }
      scheduleOrderPoll(60000);
    });
}

/* кнопка в шапке: пока корзина пустая, вместо неё — номер и статус заказа */
function renderOrderChip() {
  const btn = $('#cartToggle');
  if (!btn) return;
  if (!cartToggleHTML) cartToggleHTML = btn.innerHTML;
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const show = !!order && !orderExpired() && count === 0;
  btn.classList.toggle('is-order', show);
  btn.classList.toggle('is-final', show && !!order.final);
  if (show) {
    btn.innerHTML = `<span class="ochip__dot" aria-hidden="true"></span>` +
      `<span class="ochip__no">№${order.no}</span><span class="ochip__st">${order.label}</span>`;
    btn.setAttribute('aria-label', `Заказ №${order.no}: ${order.label}. Открыть статус`);
  } else {
    btn.innerHTML = cartToggleHTML;
    btn.removeAttribute('aria-label');
    const cc = $('#cartCount');
    if (cc) cc.textContent = count;
  }
}

/* карточка заказа внутри панели корзины */
function orderCardHTML() {
  if (!order || orderExpired()) return '';
  return `<a class="ocard${order.final ? ' is-final' : ''}" href="${order.url}">
    <span class="ocard__eyebrow">Ваш заказ №${order.no}</span>
    <b class="ocard__st">${order.label}</b>
    <span class="ocard__link">Открыть статус →</span></a>`;
}

function initOrderTrack() {
  orderLoad();
  if (order && orderExpired()) { order = null; orderSave(); }
  renderOrderChip();
  if (order) renderCart();
  scheduleOrderPoll(1500);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && order && !order.final) { clearTimeout(orderTimer); pollOrder(); }
  });
}

/* ---------- старт ---------- */
load();
repriceCart();
trackHeadHeight();
renderShop();
renderStories();
renderTabs();
renderMenu();
renderCart();
initOrderTrack();
initScrollSpy();
initHeadIcons();
initDrawer();

document.addEventListener('click', e => {
  if (e.target.closest('a[href^="tel:"]')) ym_goal('call_click');
});

function placeCart() {
  const cart = $('#cartPanel'), side = $('#corp');
  if (!cart || !side) return;
  const wide = window.matchMedia('(min-width:1100px)').matches;
  if (wide && cart.parentElement !== side) {
    side.insertBefore(cart, side.firstChild);
    cart.classList.add('is-inline');
    $('#scrim').hidden = true;
    unlockScroll();
  } else if (!wide && cart.classList.contains('is-inline')) {
    document.body.appendChild(cart);
    cart.classList.remove('is-inline');
  }
}
placeCart();
window.addEventListener('resize', placeCart);

document.addEventListener('click', e => {
  const link = e.target.closest('a[href="#story"]');
  if (!link) return;
  e.preventDefault();
  openStory();
});
$('#storyBack').addEventListener('click', closeStory);


$('#policyBack').addEventListener('click', closePolicy);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#story').hidden) closeStory();
  else if (e.key === 'Escape' && !$('#policy').hidden) closePolicy();
});
if (location.hash === '#story') openStory();

/* клик по логотипу — строго в самый верх страницы */
$('#brandLink').addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.replaceState) history.replaceState(null, '', location.pathname);
});

/* блоки проявляются по мере прокрутки */
function initReveal() {
  const items = $$('[data-reveal]');
  if (!items.length) return;
  if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  items.forEach(el => el.classList.add('will-reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  items.forEach(el => io.observe(el));
}
initReveal();
})();

/* экран загрузки: снимаем сразу, как разметка готова */
(function () {
  const pl = document.getElementById('preloader');
  if (!pl) return;
  let gone = false;
  const off = () => {
    if (gone) return;
    gone = true;
    pl.classList.add('is-off');
    setTimeout(() => { if (pl.parentNode) pl.remove(); }, 450);
  };
  if (document.readyState !== 'loading') { off(); }
  else { document.addEventListener('DOMContentLoaded', off); }
  setTimeout(off, 3000);
})();

/* фоновая проверка непринятых заказов — раз в минуту при посещении сайта */
(function () {
  const ping = () => {
    fetch('cron.php', { cache: 'no-store' }).catch(() => {});
  };
  setTimeout(ping, 4000);
  setInterval(ping, 60000);
})();
