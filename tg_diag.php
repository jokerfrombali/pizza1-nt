<?php
/* Диагностика связи сайта с Телеграмом. Открыть: /tg_diag.php?p=ПАРОЛЬ_КАБИНЕТА
   Ничего не меняет, кроме одного тестового сообщения в чат кухни. */
require dirname(__FILE__) . '/lib.php';
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
if (!isset($_GET['p']) || !hash_equals((string)$ADMIN_PASS, (string)$_GET['p'])) { http_response_code(403); exit('forbidden'); }

function line($k, $v) { echo str_pad($k, 22) . ': ' . $v . "\n"; }
function mask($s) { $s = (string)$s; return $s === '' ? '(пусто)' : substr($s, 0, 4) . '…' . substr($s, -3) . ' (' . strlen($s) . ' симв.)'; }
function raw_call($method, $params, $v4) {
    global $TOKEN;
    $ch = curl_init('https://api.telegram.org/bot' . $TOKEN . '/' . $method);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 7);
    if ($v4) { curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); }
    $t = microtime(true);
    $r = curl_exec($ch);
    $out = array('http' => curl_getinfo($ch, CURLINFO_HTTP_CODE), 'err' => curl_error($ch),
                 'ip' => curl_getinfo($ch, CURLINFO_PRIMARY_IP), 'sec' => round(microtime(true) - $t, 2), 'body' => $r);
    curl_close($ch);
    return $out;
}
function show($title, $r) {
    echo "\n== $title ==\n";
    line('HTTP', $r['http']); line('IP', $r['ip']); line('время, c', $r['sec']);
    line('ошибка curl', $r['err'] === '' ? 'нет' : $r['err']);
    echo 'ответ: ' . substr((string)$r['body'], 0, 600) . "\n";
}

echo "PHP " . PHP_VERSION . "\n";
line('curl', function_exists('curl_init') ? 'есть' : 'НЕТ');
line('openssl', extension_loaded('openssl') ? 'есть' : 'НЕТ');
line('mbstring', function_exists('mb_substr') ? 'есть' : 'НЕТ');
line('TOKEN', mask($TOKEN));
line('CHAT_ID', $CHAT_ID);
line('THREAD_ID', $THREAD_ID === '' ? '(пусто)' : $THREAD_ID);
line('OWNER_ID', $OWNER_ID);
line('SITE', $SITE);
line('DNS api.telegram.org', implode(', ', (array)@gethostbynamel('api.telegram.org')));
line('папка orders', is_writable($DIR) ? 'запись OK' : 'НЕТ ПРАВ НА ЗАПИСЬ');

show('getMe (IPv4)', raw_call('getMe', array(), true));
show('getMe (по умолчанию)', raw_call('getMe', array(), false));
show('getWebhookInfo', raw_call('getWebhookInfo', array(), true));
$send = array('chat_id' => $CHAT_ID, 'text' => '🔧 Тест связи сайта с Телеграмом (' . date('d.m H:i') . '). Можно удалить.');
if ($THREAD_ID !== '') { $send['message_thread_id'] = $THREAD_ID; }
show('sendMessage в чат кухни', raw_call('sendMessage', $send, true));

$log = $DIR . '/tg_errors.log';
echo "\n== последние ошибки (orders/tg_errors.log) ==\n";
echo file_exists($log) ? implode('', array_slice(file($log), -15)) : "(журнала пока нет)\n";
