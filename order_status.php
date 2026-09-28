<?php
/* Статус заказа по ключу — для кнопки в шапке сайта. Ничего не меняет. */
require dirname(__FILE__) . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$key = isset($_GET['k']) ? $_GET['k'] : '';
$o = order_load($key);
if (!$o) {
  http_response_code(404);
  echo json_encode(array('ok' => false));
  exit;
}

$pickup = ($o['fulfil'] === 'pickup');
$labels = array(
  'new'        => 'Принят',
  'accepted'   => 'Подтверждён',
  'cooking'    => 'Готовится',
  'delivering' => 'Курьер в пути',
  'ready'      => 'Готов к выдаче',
  'done'       => $pickup ? 'Выдан' : 'Доставлен',
  'cancelled'  => 'Отменён'
);
$st = $o['status'];

echo json_encode(array(
  'ok'      => true,
  'no'      => (int) $o['no'],
  'status'  => $st,
  'label'   => isset($labels[$st]) ? $labels[$st] : $st,
  'final'   => ($st === 'done' || $st === 'cancelled'),
  'fulfil'  => $o['fulfil'],
  'total'   => (int) $o['total'],
  'created' => (int) $o['created'],
  'updated' => isset($o['history'][$st]) ? (int) $o['history'][$st] : (int) $o['created']
), JSON_UNESCAPED_UNICODE);
