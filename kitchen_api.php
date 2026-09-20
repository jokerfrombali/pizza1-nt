<?php
/* ============================================================
   API кухонного канбана. Только для залогиненной кухни.
   ============================================================ */
require dirname(__FILE__) . '/lib.php';

session_name('pzkitchen');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

if (empty($_SESSION['kit'])) {
    http_response_code(403);
    echo json_encode(array('ok' => false, 'error' => 'auth'));
    exit;
}

/* заказ -> компактная карточка для доски */
function kitchen_card($o) {
    $items = array();
    foreach ($o['items'] as $it) {
        $items[] = array(
            'name' => $it['name'],
            'qty'  => (int) $it['qty'],
            'sum'  => (int) $it['sum'],
            'pizza' => !empty($it['pizza'])
        );
    }
    return array(
        'key'     => $o['key'],
        'no'      => (int) $o['no'],
        'created' => (int) $o['created'],
        'status'  => $o['status'],
        'fulfil'  => isset($o['fulfil']) ? $o['fulfil'] : '',
        'items'   => $items,
        'slices'  => isset($o['slices']) ? (int) $o['slices'] : 0,
        'total'   => (int) $o['total'],
        'ship'    => isset($o['ship']) ? (int) $o['ship'] : 0,
        'promo'   => isset($o['promo']) ? (int) $o['promo'] : 0,
        'box'     => isset($o['box']) ? (int) $o['box'] : 0,
        'name'    => isset($o['name']) ? $o['name'] : '',
        'phone'   => isset($o['phone']) ? $o['phone'] : '',
        'addr'    => isset($o['addr']) ? $o['addr'] : '',
        'zone'    => isset($o['zone']) ? $o['zone'] : '',
        'pay'     => isset($o['pay']) ? $o['pay'] : '',
        'payer'   => isset($o['payer']) ? $o['payer'] : '',
        'company' => isset($o['company']) ? $o['company'] : '',
        'history' => isset($o['history']) ? $o['history'] : array(),
        'reason'  => isset($o['cancel_reason']) ? $o['cancel_reason'] : '',
        'by'      => isset($o['by']) ? $o['by'] : ''
    );
}

$a = isset($_GET['a']) ? $_GET['a'] : '';

/* ---------- список заказов за день ---------- */
if ($a === 'list') {
    $today = date('Y-m-d');
    $day = isset($_GET['day']) ? $_GET['day'] : $today;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) { $day = $today; }

    $from = strtotime($day . ' 00:00:00');
    $to   = $from + 86400;
    $isToday = ($day === $today);

    $out = array();
    foreach (orders_all(1000) as $o) {
        $c = (int) $o['created'];
        $open = ($o['status'] !== 'done' && $o['status'] !== 'cancelled');
        /* в «сегодня» подтягиваем незакрытые заказы прошлых суток —
           чтобы зависший вчерашний заказ не пропал с глаз.
           Глубже не лезем: там лежит история, у которой статус никто не менял. */
        $keep = ($c >= $from && $c < $to)
             || ($isToday && $open && $c < $to && $c >= $from - 86400);
        if (!$keep) { continue; }
        $out[] = kitchen_card($o);
    }

    echo json_encode(array(
        'ok' => true, 'now' => time(), 'today' => $today,
        'day' => $day, 'locked' => !$isToday, 'orders' => $out
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- дни, за которые есть заказы ---------- */
if ($a === 'days') {
    $days = array();
    foreach (orders_all(3000) as $o) {
        $d = date('Y-m-d', (int) $o['created']);
        if (!isset($days[$d])) { $days[$d] = array('day' => $d, 'cnt' => 0, 'sum' => 0); }
        $days[$d]['cnt']++;
        if ($o['status'] !== 'cancelled') { $days[$d]['sum'] += (int) $o['total']; }
    }
    krsort($days);
    echo json_encode(array('ok' => true, 'days' => array_values($days)), JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- смена статуса ---------- */
if ($a === 'set') {
    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) { $in = array(); }
    $key = isset($in['key']) ? $in['key'] : '';
    $to  = isset($in['to']) ? $in['to'] : '';

    $o = order_load($key);
    if (!$o) {
        http_response_code(404);
        echo json_encode(array('ok' => false, 'error' => 'not_found'));
        exit;
    }
    if (!isset($STATUSES[$to])) {
        http_response_code(400);
        echo json_encode(array('ok' => false, 'error' => 'bad_status'));
        exit;
    }
    if ($o['status'] === $to) {
        echo json_encode(array('ok' => true, 'order' => kitchen_card($o)), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($to === 'cancelled') {
        $r = isset($in['reason']) ? $in['reason'] : '';
        $r = mb_substr(trim(strip_tags(is_string($r) ? $r : '')), 0, 120);
        $o['cancel_reason'] = $r;
    }

    $o = order_set_status($o, $to, 'кухня');
    echo json_encode(array('ok' => true, 'order' => kitchen_card($o)), JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
echo json_encode(array('ok' => false, 'error' => 'bad_action'));
