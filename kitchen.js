/* ============================================================
   Кухонная доска. Опрос сервера раз в 5 секунд, перетаскивание
   карточек пальцем, таймеры, звук на новый заказ, печать стикера.
   ============================================================ */
(function () {
'use strict';

var B = document.body;
var WARN1 = (+B.dataset.warn1 || 20) * 60;   /* жёлтая карточка, сек */
var WARN2 = (+B.dataset.warn2 || 35) * 60;   /* красная карточка, сек */
var POLL = 5000;

/* две колонки: всё незакрытое — в «Новые» (и старые статусы тоже) */
var OPEN = ['new', 'accepted', 'cooking', 'ready', 'delivering'];
var COLS = [
  { id: 'new',      t: 'Новые',            st: OPEN },
  { id: 'done',     t: 'Выдан',            st: ['done', 'cancelled'] }
];
var TITLE = {
  'new': 'Новый', 'accepted': 'Принят', 'cooking': 'В печи',
  'delivering': 'Курьер в пути', 'ready': 'Готов к выдаче',
  'done': 'Выдан', 'cancelled': 'Отменён'
};
var REASONS = ['Клиент отменил', 'Не дозвонились', 'Нет продукта', 'Дубль заказа', 'Другое'];

var board = document.getElementById('board');
var sheet = document.getElementById('sheet');
var sheetBox = document.getElementById('sheetBox');
var daysPanel = document.getElementById('daysPanel');
var daysBox = document.getElementById('daysBox');
var alarmEl = document.getElementById('alarm');
var stateEl = document.getElementById('state');

var orders = [];          /* текущий список */
var day = null;           /* YYYY-MM-DD, null = сегодня */
var today = null;
var locked = false;       /* архивный день */
var skew = 0;             /* разница часов сервера и планшета, сек */
var seen = {};            /* ключи заказов, которые уже видели */
var firstLoad = true;
var alarmOn = false;
var soundOn = false;
var openKey = null;

/* ---------- время ---------- */
function now() { return Math.floor(Date.now() / 1000) + skew; }
function two(n) { return n < 10 ? '0' + n : '' + n; }
function hhmm(ts) { var d = new Date(ts * 1000); return two(d.getHours()) + ':' + two(d.getMinutes()); }
function mmss(s) {
  if (s < 0) { s = 0; }
  var m = Math.floor(s / 60);
  if (m < 60) { return m + ':' + two(s % 60); }
  return Math.floor(m / 60) + ' ч ' + two(m % 60);
}
function money(n) { return (n | 0).toLocaleString('ru-RU') + ' ₽'; }

/* ---------- звук ---------- */
var actx = null;
function beep() {
  if (!soundOn) { return; }
  try {
    if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); }
    var t = actx.currentTime;
    [0, 0.28, 0.56].forEach(function (off) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.35, t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.22);
      o.connect(g); g.connect(actx.destination);
      o.start(t + off); o.stop(t + off + 0.24);
    });
  } catch (e) {}
}
document.getElementById('sound').addEventListener('click', function () {
  soundOn = !soundOn;
  this.classList.toggle('is-on', soundOn);
  this.textContent = soundOn ? '🔊 Звук включён' : '🔇 Звук выключен';
  if (soundOn) { beep(); }
});

var alarmTimer = null;
function setAlarm(on) {
  if (on === alarmOn) { return; }
  alarmOn = on;
  alarmEl.hidden = !on;
  B.classList.toggle('has-alarm', on);
  if (on) {
    beep();
    alarmTimer = setInterval(beep, 12000);
  } else {
    clearInterval(alarmTimer); alarmTimer = null;
  }
}
alarmEl.addEventListener('click', function () { setAlarm(false); });

/* ---------- запросы ---------- */
function api(q, body) {
  var opt = { credentials: 'same-origin' };
  if (body) {
    opt.method = 'POST';
    opt.headers = { 'Content-Type': 'application/json' };
    opt.body = JSON.stringify(body);
  }
  return fetch('kitchen_api.php?' + q, opt).then(function (r) {
    if (r.status === 403) { location.href = 'kitchen.php'; throw new Error('auth'); }
    return r.json();
  });
}

function load() {
  return api('a=list' + (day ? '&day=' + day : '')).then(function (j) {
    if (!j || !j.ok) { throw new Error('bad'); }
    skew = j.now - Math.floor(Date.now() / 1000);
    today = j.today;
    locked = j.locked;
    var fresh = false;
    j.orders.forEach(function (o) {
      if (!seen[o.key]) {
        seen[o.key] = 1;
        if (!firstLoad && o.status === 'new') { fresh = true; }
      }
    });
    firstLoad = false;
    orders = j.orders;
    if (fresh) { setAlarm(true); }
    if (alarmOn && !orders.some(function (o) { return o.status === 'new'; })) { setAlarm(false); }
    stateEl.classList.remove('is-bad');
    render();
  }).catch(function () {
    stateEl.classList.add('is-bad');
  });
}

/* ---------- отрисовка ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function cardHTML(o) {
  var age = now() - o.created;
  var open = (o.status !== 'done' && o.status !== 'cancelled');
  var cls = 'kc';
  if (open && age >= WARN2) { cls += ' is-hot'; }
  else if (open && age >= WARN1) { cls += ' is-warm'; }
  if (!open) { cls += ' is-done'; }

  var items = o.items.map(function (it) {
    return '<div><b>' + it.qty + '×</b> ' + esc(it.name) + '</div>';
  }).join('');

  var tag = o.fulfil === 'pickup'
    ? '<span class="kc__tag kc__tag--pickup">Самовывоз</span>'
    : '<span class="kc__tag">' + esc(o.zone || 'Доставка') + '</span>';

  var timer = open
    ? '<span class="kc__t">' + mmss(age) + '</span>'
    : '<span class="kc__t">' + hhmm(o.created) + '</span>';

  var note = '';
  if (o.status === 'cancelled') {
    note = '<div class="kc__note">Отменён' + (o.reason ? ': ' + esc(o.reason) : '') + '</div>';
  }

  return '<div class="' + cls + '" data-key="' + o.key + '">' +
    '<div class="kc__h"><span class="kc__no">№' + o.no + '</span>' + tag + timer + '</div>' +
    '<div class="kc__items">' + items + '</div>' + note +
    '<div class="kc__foot">' + hhmm(o.created) +
      (o.slices ? ' · ' + o.slices + ' порц.' : '') +
      '<span class="kc__sum">' + money(o.total) + '</span></div>' +
  '</div>';
}

function render() {
  var html = COLS.map(function (c) {
    var list = orders.filter(function (o) { return c.st.indexOf(o.status) >= 0; });
    if (c.id === 'done') {
      list.sort(function (a, b) { return b.created - a.created; });
    } else {
      list.sort(function (a, b) { return a.created - b.created; });  /* старые сверху — их делать первыми */
    }
    return '<section class="kcol kcol--' + c.id + '" data-col="' + c.id + '">' +
      '<div class="kcol__h">' + c.t + '<span class="kcol__n">' + list.length + '</span></div>' +
      '<div class="kcol__b">' +
        (list.length ? list.map(cardHTML).join('') : '<div class="kempty">пусто</div>') +
      '</div></section>';
  }).join('');
  board.innerHTML = html;
  document.getElementById('dayBtn').textContent =
    (!day || day === today) ? 'Сегодня' : day.split('-').reverse().join('.');
  if (openKey) { openSheet(openKey, true); }
}

/* таймеры тикают локально, без запросов */
setInterval(function () {
  var t = now();
  document.getElementById('clock').textContent = hhmm(t);
  orders.forEach(function (o) {
    if (o.status === 'done' || o.status === 'cancelled') { return; }
    var el = board.querySelector('.kc[data-key="' + o.key + '"]');
    if (!el) { return; }
    var age = t - o.created;
    el.querySelector('.kc__t').textContent = mmss(age);
    el.classList.toggle('is-warm', age >= WARN1 && age < WARN2);
    el.classList.toggle('is-hot', age >= WARN2);
  });
}, 1000);

/* ---------- переходы статусов ---------- */
function colToStatus(colId, o) {
  if (colId === 'done') { return 'done'; }
  return OPEN.indexOf(o.status) >= 0 ? o.status : 'new';
}
function nextOf(o) {
  return OPEN.indexOf(o.status) >= 0 ? { to: 'done', label: '🏁 Выдан клиенту' } : null;
}
function prevOf(o) {
  return null;
}

function setStatus(key, to, reason) {
  var o = orders.filter(function (x) { return x.key === key; })[0];
  if (!o) { return; }
  o.status = to;                       /* оптимистично: доска не ждёт сервер */
  if (reason) { o.reason = reason; }
  render();
  api('a=set', { key: key, to: to, reason: reason || '' }).then(function (j) {
    if (j && j.ok && j.order) {
      orders = orders.map(function (x) { return x.key === key ? j.order : x; });
      render();
    }
  }).catch(function () { load(); });
}

/* ---------- перетаскивание пальцем ---------- */
var drag = null;
board.addEventListener('pointerdown', function (e) {
  var card = e.target.closest ? e.target.closest('.kc') : null;
  if (!card) { return; }
  drag = {
    key: card.dataset.key, card: card, x0: e.clientX, y0: e.clientY,
    t0: Date.now(), moved: false, ghost: null, col: null, id: e.pointerId
  };
  if (!locked) {
    drag.hold = setTimeout(function () { if (drag && !drag.moved) { start(e.clientX, e.clientY); } }, 320);
  }
});

function start(x, y) {
  if (!drag || drag.ghost || locked) { return; }
  var r = drag.card.getBoundingClientRect();
  var g = drag.card.cloneNode(true);
  g.className = 'kc kghost';
  g.style.width = r.width + 'px';
  document.body.appendChild(g);
  drag.ghost = g;
  drag.dx = x - r.left; drag.dy = y - r.top;
  drag.card.classList.add('is-drag');
  move(x, y);
  if (navigator.vibrate) { navigator.vibrate(12); }
}

function move(x, y) {
  if (!drag || !drag.ghost) { return; }
  drag.ghost.style.left = (x - drag.dx) + 'px';
  drag.ghost.style.top = (y - drag.dy) + 'px';
  drag.ghost.style.position = 'fixed';
  var el = document.elementFromPoint(x, y);
  var col = el && el.closest ? el.closest('.kcol') : null;
  if (col !== drag.col) {
    if (drag.col) { drag.col.classList.remove('is-drop'); }
    drag.col = col;
    if (col) { col.classList.add('is-drop'); }
  }
}

window.addEventListener('pointermove', function (e) {
  if (!drag || e.pointerId !== drag.id) { return; }
  var dx = Math.abs(e.clientX - drag.x0), dy = Math.abs(e.clientY - drag.y0);
  if (!drag.moved && (dx > 8 || dy > 8)) { drag.moved = true; }
  if (!drag.ghost && dx > 14 && dx > dy && !locked) { clearTimeout(drag.hold); start(e.clientX, e.clientY); }
  if (drag.ghost) { e.preventDefault(); move(e.clientX, e.clientY); }
}, { passive: false });

window.addEventListener('pointerup', function (e) {
  if (!drag || e.pointerId !== drag.id) { return; }
  clearTimeout(drag.hold);
  var d = drag; drag = null;
  if (d.ghost) {
    d.ghost.remove();
    d.card.classList.remove('is-drag');
    if (d.col) { d.col.classList.remove('is-drop'); }
    var o = orders.filter(function (x) { return x.key === d.key; })[0];
    if (o && d.col) {
      var colId = d.col.dataset.col;
      var to = colToStatus(colId, o);
      if (to !== o.status) {
        if (colId === 'done') { askCancelOrDone(o); }
        else { setStatus(o.key, to); }
      }
    }
    return;
  }
  if (!d.moved && Date.now() - d.t0 < 700) { openSheet(d.key); }
});
window.addEventListener('pointercancel', function () {
  if (drag) {
    clearTimeout(drag.hold);
    if (drag.ghost) { drag.ghost.remove(); drag.card.classList.remove('is-drag'); }
    if (drag.col) { drag.col.classList.remove('is-drop'); }
    drag = null;
  }
});

/* ---------- шторка заказа ---------- */
function openSheet(key, keepScroll) {
  var o = orders.filter(function (x) { return x.key === key; })[0];
  if (!o) { closeSheet(); return; }
  openKey = key;
  var n = nextOf(o), p = prevOf(o);
  var acts = [];
  if (!locked && n) { acts.push('<button class="b-go" data-to="' + n.to + '">' + n.label + '</button>'); }
  acts.push('<button class="b-print">🧾 Печать стикера</button>');
  if (!locked && p) { acts.push('<button class="b-back" data-to="' + p + '">↩ Вернуть в «' + TITLE[p] + '»</button>'); }
  if (o.status !== 'cancelled' && o.status !== 'done') {
    acts.push('<button class="b-cancel">✖ Отменить заказ</button>');
  }
  if (locked && o.status !== 'done' && o.status !== 'cancelled') {
    acts.push('<button class="b-go" data-to="done">🏁 Закрыть заказ</button>');
    acts.push('<button class="b-cancel">✖ Отменить заказ</button>');
  }
  acts.push('<button class="b-close">Закрыть</button>');

  var steps = Object.keys(o.history || {}).map(function (k) {
    return '<span>' + (TITLE[k] || k) + ' ' + hhmm(o.history[k]) + '</span>';
  }).join('');

  var contact = '<div class="ks__contact"><b>' + esc(o.name) + '</b> · ' +
    '<a href="tel:' + esc(String(o.phone).replace(/\D/g, '')) + '">' + esc(o.phone) + '</a><br>' +
    (o.fulfil === 'pickup' ? 'Самовывоз, Куйбышева 14' : esc(o.addr) + (o.zone ? ' · ' + esc(o.zone) : '')) +
    '<br>' + esc(o.pay) +
    (o.payer === 'company' && o.company ? '<br>🏢 ' + esc(o.company) : '') + '</div>';

  sheetBox.innerHTML =
    '<h2 class="ks__no">№' + o.no + ' · ' + (TITLE[o.status] || o.status) + '</h2>' +
    '<p class="ks__meta">' + hhmm(o.created) + ' · ' + mmss(now() - o.created) + ' назад' +
      (o.by ? ' · ' + esc(o.by) : '') + '</p>' +
    '<div class="ks__items">' + o.items.map(function (it) {
      return '<div><b>' + it.qty + '×</b> ' + esc(it.name) + ' — ' + money(it.sum) + '</div>';
    }).join('') +
      (o.box ? '<div>Упаковка — ' + money(o.box) + '</div>' : '') +
      (o.promo ? '<div>Промокод — −' + money(o.promo) + '</div>' : '') +
      '<div>Доставка — ' + (o.ship > 0 ? money(o.ship) : 'бесплатно') + '</div>' +
      '<div><b>ИТОГО ' + money(o.total) + '</b></div></div>' +
    contact +
    (steps ? '<div class="ks__steps">' + steps + '</div>' : '') +
    '<div class="ks__acts">' + acts.join('') + '</div>';

  sheet.hidden = false;
}
function closeSheet() { sheet.hidden = true; openKey = null; }

sheet.addEventListener('click', function (e) {
  if (e.target.dataset.close) { closeSheet(); return; }
  var b = e.target.closest ? e.target.closest('button') : null;
  if (!b || !openKey) { return; }
  var key = openKey;
  if (b.classList.contains('b-close')) { closeSheet(); return; }
  if (b.classList.contains('b-print')) { printSticker(key); return; }
  if (b.classList.contains('b-cancel')) { askReason(key); return; }
  if (b.dataset.to) { setStatus(key, b.dataset.to); closeSheet(); }
});

/* перетащили в «Выдан»: уточняем — выдан или отменён */
function askCancelOrDone(o) {
  openKey = o.key;
  sheetBox.innerHTML = '<h2 class="ks__no">№' + o.no + '</h2>' +
    '<p class="ks__meta">Чем закончился заказ?</p>' +
    '<div class="ks__acts">' +
      '<button class="b-go" data-to="done">🏁 Выдан клиенту</button>' +
      '<button class="b-cancel">✖ Отменён</button>' +
      '<button class="b-close">Назад</button></div>';
  sheet.hidden = false;
}

/* отмена — только с причиной, заказ не удаляется */
function askReason(key) {
  openKey = key;
  sheetBox.innerHTML = '<h2 class="ks__no">Причина отмены</h2>' +
    '<p class="ks__meta">Заказ не удаляется — он останется в колонке «Выдан» с пометкой.</p>' +
    '<div class="ks__acts">' +
      REASONS.map(function (r) { return '<button class="b-cancel" data-reason="' + esc(r) + '">' + esc(r) + '</button>'; }).join('') +
      '<button class="b-close">Назад</button></div>';
  sheetBox.querySelectorAll('[data-reason]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      setStatus(key, 'cancelled', b.dataset.reason);
      closeSheet();
    });
  });
  sheet.hidden = false;
}

/* ---------- печать стикера ---------- */
function printSticker(key) {
  var f = document.getElementById('printer');
  f.onload = function () {
    try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {}
  };
  f.src = 'sticker.php?k=' + encodeURIComponent(key) + '&t=' + Date.now();
}

/* ---------- дни ---------- */
document.getElementById('dayBtn').addEventListener('click', function () {
  api('a=days').then(function (j) {
    if (!j || !j.ok) { return; }
    daysBox.innerHTML = '<h2>Заказы по дням</h2>' + j.days.map(function (d) {
      var cur = (d.day === (day || today));
      return '<button class="kdrow' + (cur ? ' is-cur' : '') + '" data-day="' + d.day + '">' +
        d.day.split('-').reverse().join('.') +
        (d.day === j.days[0].day && d.day === today ? ' · сегодня' : '') +
        '<span>' + d.cnt + ' зак. · ' + money(d.sum) + '</span></button>';
    }).join('') + '<div class="ks__acts"><button class="b-close">Закрыть</button></div>';
    daysPanel.hidden = false;
  });
});
daysPanel.addEventListener('click', function (e) {
  if (e.target.dataset.close || (e.target.closest('button') && e.target.closest('button').classList.contains('b-close'))) {
    daysPanel.hidden = true; return;
  }
  var row = e.target.closest ? e.target.closest('[data-day]') : null;
  if (!row) { return; }
  day = (row.dataset.day === today) ? null : row.dataset.day;
  daysPanel.hidden = true;
  load();
});
function shiftDay(n) {
  var base = day || today;
  if (!base) { return; }
  var d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + n);
  var s = d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  if (s > today) { return; }
  day = (s === today) ? null : s;
  load();
}
document.getElementById('prevDay').addEventListener('click', function () { shiftDay(-1); });
document.getElementById('nextDay').addEventListener('click', function () { shiftDay(1); });

/* ---------- старт ---------- */
if (B.dataset.nopass) { B.classList.add('has-warn'); }
load();
setInterval(load, POLL);
document.addEventListener('visibilitychange', function () { if (!document.hidden) { load(); } });
})();
