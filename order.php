<?php
require dirname(__FILE__) . '/lib.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'error' => 'method'));
    exit;
}

$ip   = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'x';
$lock = sys_get_temp_dir() . '/pz_' . md5($ip);
if (file_exists($lock) && (time() - filemtime($lock)) < 10) {
    http_response_code(429);
    echo json_encode(array('ok' => false, 'error' => 'too_fast'));
    exit;
}
@touch($lock);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || empty($data['items'])) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'bad_data'));
    exit;
}

function clean($v, $max = 200) {
    $v = is_string($v) ? $v : '';
    $v = strip_tags($v);
    $v = str_replace(array('<', '>'), '', $v);
    return mb_substr(trim($v), 0, $max);
}
function g($d, $k, $max = 200) { return clean(isset($d[$k]) ? $d[$k] : '', $max); }

$name  = g($data, 'name', 80);
$phone = g($data, 'phone', 30);
if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 10) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'no_contact'));
    exit;
}

$items = array();
foreach ($data['items'] as $it) {
    $n = clean(isset($it['name']) ? $it['name'] : '', 80);
    $q = (int) (isset($it['qty']) ? $it['qty'] : 0);
    if ($n === '' || $q < 1) { continue; }
    $items[] = array('name' => $n, 'qty' => $q, 'sum' => (int)(isset($it['sum']) ? $it['sum'] : 0), 'pizza' => !empty($it['pizza']));
}
if (!$items) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'no_items'));
    exit;
}


/* ---------- стоимость упаковки: считаем на сервере ---------- */
function box_cost($slices) {
    $n = (int) $slices;
    if ($n < 1) { return 0; }
    $prices = array(2 => 35, 4 => 50, 8 => 70);
    $best = array(0 => 0);
    for ($i = 1; $i <= $n; $i++) {
        $best[$i] = PHP_INT_MAX;
        foreach ($prices as $sz => $pr) {
            $prev = max(0, $i - $sz);
            $c = $pr + $best[$prev];
            if ($c < $best[$i]) { $best[$i] = $c; }
        }
    }
    return $best[$n];
}

$slices = 0;
foreach ($items as $it) { if (!empty($it['pizza'])) { $slices += (int) $it['qty']; } }
$box = box_cost($slices);
$box_sent = (int) (isset($data['box']) ? $data['box'] : 0);

$cnt = $DIR . '/counter.txt';
$no  = file_exists($cnt) ? ((int) file_get_contents($cnt) + 1) : 1;
@file_put_contents($cnt, $no);

$key = bin2hex(openssl_random_pseudo_bytes(4));

$o = array(
    'key' => $key, 'no' => $no, 'created' => time(),
    'status' => 'new', 'history' => array('new' => time()),
    'items' => $items,
    'total' => (int) (isset($data['total']) ? $data['total'] : 0),
    'box' => $box, 'slices' => $slices,
    'box_warn' => ($box_sent !== $box),
    'ship'  => (int) (isset($data['ship'])  ? $data['ship']  : 0),
    'disc'  => (int) (isset($data['disc'])  ? $data['disc']  : 0),
    'promo' => (int) (isset($data['promo']) ? $data['promo'] : 0),
    'name' => $name, 'phone' => $phone,
    'addr' => g($data, 'addr'), 'zone' => g($data, 'zone', 80),
    'fulfil' => g($data, 'fulfil', 20), 'payer' => g($data, 'payer', 20),
    'pay' => g($data, 'pay', 40),
    'company' => g($data, 'company', 120), 'inn' => g($data, 'inn', 20),
    'email' => g($data, 'email', 80),
    'eta' => 0, 'bonus' => 0
);

order_save($o);

$send = array(
    'chat_id' => $CHAT_ID, 'text' => tg_text($o), 'parse_mode' => 'HTML'
);
$isCorp = ($o['payer'] === 'company');
$th = ($isCorp && $THREAD_CORP !== '') ? $THREAD_CORP : $THREAD_ID;
if ($th !== '') { $send['message_thread_id'] = $th; }
$kb = tg_buttons($o);
if ($kb !== '') { $send['reply_markup'] = $kb; }

$r = tg_call('sendMessage', $send);
if (isset($r['result']['message_id'])) {
    $o['msg_id'] = $r['result']['message_id'];
    order_save($o);
} else {
    // сообщение не ушло в чат — сигналим владельцу лично
    tg_call('sendMessage', array(
        'chat_id' => $OWNER_ID,
        'parse_mode' => 'HTML',
        'text' => "⚠️ <b>Заказ №{$no} не попал в чат кухни</b>\n\n"
            . "{$name} · {$phone}\n"
            . 'Сумма: ' . money($o['total']) . "\n\n"
            . 'Заказ сохранён, откройте кабинет: ' . $SITE . '/admin.php'
    ));
}

sms_send($phone, 'Заказ №' . $no . ' принят. Статус: ' . $SITE . '/z.php?k=' . $key);

echo json_encode(array('ok' => true, 'no' => $no, 'url' => $SITE . '/z.php?k=' . $key));
