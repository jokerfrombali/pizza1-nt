<?php
require dirname(__FILE__) . '/lib.php';

$hdr = isset($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']) ? $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] : '';
if ($hdr !== $SECRET) { http_response_code(403); exit; }

$u = json_decode(file_get_contents('php://input'), true);
if (!isset($u['callback_query'])) { echo 'ok'; exit; }

$cq   = $u['callback_query'];
$data = isset($cq['data']) ? $cq['data'] : '';
$who  = isset($cq['from']['first_name']) ? $cq['from']['first_name'] : '';

$parts = explode(':', $data);
if (count($parts) !== 3 || $parts[0] !== 'st') {
    tg_call('answerCallbackQuery', array('callback_query_id' => $cq['id']));
    exit;
}

$new = $parts[1];
$key = $parts[2];
$o   = order_load($key);

if (!$o || !isset($STATUSES[$new])) {
    tg_call('answerCallbackQuery', array('callback_query_id' => $cq['id'], 'text' => 'Заказ не найден'));
    exit;
}

if (empty($o['msg_id'])) { $o['msg_id'] = $cq['message']['message_id']; }
$o = order_set_status($o, $new, $who);

tg_call('answerCallbackQuery', array(
    'callback_query_id' => $cq['id'],
    'text' => $STATUSES[$new]
));

echo 'ok';
