<?php
/* ============================================================
   Общие настройки и функции. Правится только этот файл.
   ============================================================ */

require dirname(__FILE__) . "/config.local.php";

date_default_timezone_set('Asia/Yekaterinburg');

$DIR = dirname(__FILE__) . '/orders';
if (!is_dir($DIR)) { @mkdir($DIR, 0700); }

$STATUSES = array(
    'new'        => 'Заказ принят',
    'accepted'   => 'Подтверждён',
    'cooking'    => 'Готовится',
    'delivering' => 'Курьер в пути',
    'ready'      => 'Готов к выдаче',
    'done'       => 'Доставлен',
    'cancelled'  => 'Отменён'
);

function order_path($key) {
    global $DIR;
    if (!preg_match('/^[a-f0-9]{8}$/', $key)) { return false; }
    return $DIR . '/' . $key . '.json';
}

function order_load($key) {
    $p = order_path($key);
    if (!$p || !file_exists($p)) { return null; }
    return json_decode(file_get_contents($p), true);
}

function order_save($o) {
    $p = order_path($o['key']);
    if (!$p) { return false; }
    return file_put_contents($p, json_encode($o, JSON_UNESCAPED_UNICODE));
}

/* Отправка в Телеграм.
   Связь хостинга с api.telegram.org нестабильна, поэтому:
   - несколько попыток, в том числе через запасной адрес Телеграма;
   - если сеть так и не ответила, sendMessage кладётся в очередь orders/tg_queue
     и досылается функцией tg_queue_flush() (cron.php и order_status.php). */
function tg_try($method, $params, $attempts) {
    global $TOKEN;
    $ips = array('', '149.154.167.220', '149.154.166.110');
    for ($i = 0; $i < $attempts; $i++) {
        $ch = curl_init('https://api.telegram.org/bot' . $TOKEN . '/' . $method);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        $ip = $ips[$i % count($ips)];
        if ($ip !== '') { curl_setopt($ch, CURLOPT_RESOLVE, array('api.telegram.org:443:' . $ip)); }
        $r = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $j = json_decode($r, true);
        if (is_array($j)) {
            if (empty($j['ok'])) {
                tg_log($method . ' http=' . $code . ' err=' . $err . ' resp=' . substr((string)$r, 0, 300));
            }
            return $j;   // Телеграм ответил — повторять незачем
        }
        tg_log($method . ' try=' . ($i + 1) . ' ip=' . ($ip === '' ? 'dns' : $ip) . ' http=' . $code . ' err=' . $err);
    }
    return null;         // сеть так и не ответила
}

function tg_call($method, $params) {
    $j = tg_try($method, $params, 2);
    if ($j === null && $method === 'sendMessage') { tg_queue_add($method, $params); }
    return $j;
}

function tg_queue_add($method, $params) {
    global $DIR;
    $q = $DIR . '/tg_queue';
    if (!is_dir($q)) { @mkdir($q, 0700); }
    $f = $q . '/' . sprintf('%.4f', microtime(true)) . '_' . mt_rand(1000, 9999) . '.json';
    @file_put_contents($f, json_encode(array('m' => $method, 'p' => $params, 't' => time()), JSON_UNESCAPED_UNICODE));
    tg_log('queued ' . basename($f));
}

/* досылка очереди: не чаще раза в 15 секунд и не дольше 40 секунд за раз */
function tg_queue_flush() {
    global $DIR;
    $files = glob($DIR . '/tg_queue/*.json');
    if (!$files) { return; }
    $lock = @fopen($DIR . '/tg_queue.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) { return; }
    $last = (int)@file_get_contents($DIR . '/tg_queue.last');
    if (time() - $last < 15) { flock($lock, LOCK_UN); return; }
    @file_put_contents($DIR . '/tg_queue.last', time());
    sort($files);
    $start = time();
    foreach ($files as $f) {
        if (time() - $start > 40) { break; }
        $x = json_decode(@file_get_contents($f), true);
        if (!is_array($x) || time() - (int)$x['t'] > 86400) { @unlink($f); continue; }
        $p = $x['p'];
        if (isset($p['text'])) {
            $p['text'] = '⏱ <i>доставлено с задержкой (' . date('H:i', (int)$x['t']) . ')</i>' . "\n\n" . $p['text'];
        }
        $j = tg_try($x['m'], $p, 3);
        if ($j === null) { break; }  // сеть всё ещё недоступна — попробуем позже
        @unlink($f);                 // доставлено (или Телеграм отказал — повтор не поможет)
    }
    flock($lock, LOCK_UN);
}

/* для страниц-опросов: сначала отдать ответ посетителю, потом досылать */
function tg_queue_flush_after_response() {
    if (function_exists('fastcgi_finish_request')) { @fastcgi_finish_request(); }
    tg_queue_flush();
}

/* журнал ошибок отправки в Телеграм: orders/tg_errors.log */
function tg_log($msg) {
    global $DIR;
    @file_put_contents($DIR . '/tg_errors.log', date('Y-m-d H:i:s') . ' ' . $msg . "\n", FILE_APPEND);
}

function money($n) { return number_format((int)$n, 0, ',', ' ') . ' ₽'; }

/* кнопки под заказом зависят от текущего статуса */
function tg_buttons($o) {
    $k = $o['key'];
    $pickup = ($o['fulfil'] === 'pickup');
    $rows = array();
    switch ($o['status']) {
        case 'new':
            $rows[] = array(array('text' => '✅ Подтвердить', 'callback_data' => 'st:accepted:' . $k));
            $rows[] = array(array('text' => '✖️ Отменить',   'callback_data' => 'st:cancelled:' . $k));
            break;
        case 'accepted':
            $rows[] = array(array('text' => '🔥 В печь', 'callback_data' => 'st:cooking:' . $k));
            break;
        case 'cooking':
            $rows[] = $pickup
                ? array(array('text' => '📦 Готов к выдаче', 'callback_data' => 'st:ready:' . $k))
                : array(array('text' => '🛵 Передал курьеру', 'callback_data' => 'st:delivering:' . $k));
            break;
        case 'ready':
        case 'delivering':
            $rows[] = array(array('text' => '🏁 Выдан клиенту', 'callback_data' => 'st:done:' . $k));
            break;
    }
    return $rows ? json_encode(array('inline_keyboard' => $rows)) : '';
}

/* текст сообщения в Телеграме */
function tg_text($o) {
    global $STATUSES, $SITE;
    $L = array();
    $L[] = '🍕 <b>ЗАКАЗ №' . $o['no'] . '</b> — ' . $STATUSES[$o['status']];
    $L[] = '';
    foreach ($o['items'] as $it) {
        $L[] = '• ' . $it['name'] . ' × ' . $it['qty'] . ' — ' . money($it['sum']);
    }
    $L[] = '';
    if (!empty($o['promo'])) { $L[] = 'Промокод: −' . money($o['promo']); }
    if (!empty($o['box'])) {
        $L[] = 'Упаковка: ' . money($o['box'])
             . (empty($o['slices']) ? '' : ' (' . $o['slices'] . ' порц.)')
             . (empty($o['box_warn']) ? '' : ' ⚠️ расходится с сайтом');
    }
    $L[] = 'Доставка: ' . ($o['ship'] > 0 ? money($o['ship']) : 'бесплатно');
    $L[] = '<b>ИТОГО: ' . money($o['total']) . '</b>';
    $L[] = '';
    $L[] = '👤 ' . $o['name'];
    $L[] = '📞 ' . $o['phone'];
    if ($o['fulfil'] === 'pickup') {
        $L[] = '🏠 Самовывоз, Куйбышева 14';
    } else {
        $L[] = '📍 ' . $o['addr'];
        if (!empty($o['zone'])) { $L[] = '🗺 ' . $o['zone']; }
    }
    $L[] = '💳 ' . $o['pay'];
    if ($o['payer'] === 'company') {
        $L[] = '';
        $L[] = '🏢 ' . $o['company'] . ' · ИНН ' . $o['inn'] . ' · ' . $o['email'];
    }
    $L[] = '';
    $L[] = '🔗 ' . $SITE . '/z.php?k=' . $o['key'];
    $L[] = '🕒 ' . date('d.m.Y H:i', $o['created']);
    return implode("\n", $L);
}

/* начисление бонусов при закрытии заказа */
function bonus_add($phone, $sum) {
    global $DIR, $BONUS_PCT;
    $digits = preg_replace('/\D/', '', $phone);
    if (strlen($digits) < 10) { return 0; }
    $f = $DIR . '/b_' . substr($digits, -10) . '.json';
    $b = file_exists($f) ? json_decode(file_get_contents($f), true) : array('points' => 0, 'orders' => 0);
    $add = (int) round($sum * $BONUS_PCT / 100);
    $b['points'] += $add;
    $b['orders'] += 1;
    file_put_contents($f, json_encode($b));
    return $add;
}

/* заготовка под СМС: подключим сервис — заработает */
function sms_send($phone, $text) {
    global $SMS_KEY;
    if ($SMS_KEY === '') { return false; }
    // здесь будет вызов выбранного сервиса
    return false;
}

/* смена статуса: обновляет файл, правит сообщение в Телеграме */
function order_set_status($o, $new, $who = '') {
    global $STATUSES, $CHAT_ID;
    if (!isset($STATUSES[$new])) { return $o; }
    $o['status'] = $new;
    $o['history'][$new] = time();
    if ($who !== '') { $o['by'] = $who; }
    if ($new === 'done' && empty($o['bonus'])) {
        $o['bonus'] = bonus_add($o['phone'], $o['total']);
    }
    order_save($o);
    if (!empty($o['msg_id'])) {
        $edit = array(
            'chat_id' => $CHAT_ID, 'message_id' => $o['msg_id'],
            'text' => tg_text($o), 'parse_mode' => 'HTML'
        );
        $kb = tg_buttons($o);
        if ($kb !== '') { $edit['reply_markup'] = $kb; }
        tg_call('editMessageText', $edit);
    }
    return $o;
}

/* все заказы, свежие сверху */
function orders_all($limit = 200) {
    global $DIR;
    $out = array();
    foreach (glob($DIR . '/*.json') as $f) {
        if (strpos(basename($f), 'b_') === 0) { continue; }
        $o = json_decode(file_get_contents($f), true);
        if (is_array($o) && isset($o['no'])) { $out[] = $o; }
    }
    usort($out, function ($a, $b) { return $b['created'] - $a['created']; });
    return array_slice($out, 0, $limit);
}
