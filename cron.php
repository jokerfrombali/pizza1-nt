<?php
/* Проверка непринятых заказов и утренняя сводка.
   Запускается планировщиком раз в минуту. */

require dirname(__FILE__) . '/lib.php';

$now = time();
$log = array();

/* не чаще раза в минуту, чтобы посетители не дёргали лишний раз */
$tick = $DIR . '/tick.txt';
if (!isset($_GET['force']) && file_exists($tick) && ($now - filemtime($tick)) < 55) {
    echo 'skip'; exit;
}
@touch($tick);

/* ---------- непринятые заказы ---------- */

foreach (orders_all(300) as $o) {
    if ($o['status'] !== 'new') { continue; }
    $age = $now - $o['created'];

    if ($age >= $WARN_2 && empty($o['warn2'])) {
        $o['warn2'] = $now;
        order_save($o);
        $mins = round($age / 60);
        tg_call('sendMessage', array(
            'chat_id' => $OWNER_ID,
            'parse_mode' => 'HTML',
            'text' => "🚨 <b>Заказ №{$o['no']} не принят {$mins} мин</b>\n\n"
                . "{$o['name']} · {$o['phone']}\n"
                . 'Сумма: ' . money($o['total']) . "\n"
                . ($o['fulfil'] === 'pickup' ? 'Самовывоз' : $o['addr']) . "\n\n"
                . "Кухня не нажала «Подтвердить». Клиент ждёт.\n"
                . $SITE . '/admin.php'
        ));
        $log[] = "владельцу: №{$o['no']}";
    }
    elseif ($age >= $WARN_1 && empty($o['warn1'])) {
        $o['warn1'] = $now;
        order_save($o);
        $mins = round($age / 60);
        $send = array(
            'chat_id' => $CHAT_ID,
            'parse_mode' => 'HTML',
            'text' => "⏰ <b>Заказ №{$o['no']} висит {$mins} мин</b>\n\n"
                . "{$o['name']} · {$o['phone']}\n"
                . 'Сумма: ' . money($o['total']) . "\n"
                . ($o['fulfil'] === 'pickup' ? 'Самовывоз' : $o['addr']) . "\n\n"
                . 'Подтвердите заказ — клиент ждёт.'
        );
        $th = $THREAD_LOST !== '' ? $THREAD_LOST : $THREAD_ID;
        if ($th !== '') { $send['message_thread_id'] = $th; }
        tg_call('sendMessage', $send);
        $log[] = "напоминание: №{$o['no']}";
    }
}

/* ---------- утренняя сводка ---------- */

$mark = $DIR . '/summary.txt';
$today = date('Y-m-d');
$sent = file_exists($mark) ? trim(file_get_contents($mark)) : '';

if ((int) date('G') === $SUMMARY_H && $sent !== $today) {
    @file_put_contents($mark, $today);

    $from = strtotime('yesterday');
    $to   = strtotime('today');
    $cnt = 0; $sum = 0; $late = 0; $cancel = 0;
    $accept = array(); $full = array();

    foreach (orders_all(500) as $o) {
        if ($o['created'] < $from || $o['created'] >= $to) { continue; }
        if ($o['status'] === 'cancelled') { $cancel++; continue; }
        $cnt++; $sum += $o['total'];
        if (!empty($o['warn1'])) { $late++; }
        if (isset($o['history']['accepted'])) {
            $accept[] = $o['history']['accepted'] - $o['history']['new'];
        }
        if (isset($o['history']['done'])) {
            $full[] = $o['history']['done'] - $o['history']['new'];
        }
    }

    $avg  = $cnt ? round($sum / $cnt) : 0;
    $mAcc = $accept ? round(array_sum($accept) / count($accept) / 60) : 0;
    $mAll = $full ? round(array_sum($full) / count($full) / 60) : 0;

    $t = "📊 <b>Сводка за " . date('d.m.Y', $from) . "</b>\n\n"
       . "Заказов: <b>{$cnt}</b>\n"
       . 'Выручка: <b>' . money($sum) . "</b>\n"
       . 'Средний чек: ' . money($avg) . "\n\n"
       . 'Приняли в среднем за: ' . ($mAcc ? $mAcc . ' мин' : '—') . "\n"
       . 'Полный цикл до выдачи: ' . ($mAll ? $mAll . ' мин' : '—') . "\n";
    if ($late)   { $t .= "\n⚠️ Долго не принимали: <b>{$late}</b>"; }
    if ($cancel) { $t .= "\n✖️ Отменено: {$cancel}"; }
    if (!$cnt)   { $t = "📊 <b>Сводка за " . date('d.m.Y', $from) . "</b>\n\nЗаказов не было."; }

    tg_call('sendMessage', array(
        'chat_id' => $OWNER_ID, 'parse_mode' => 'HTML', 'text' => $t
    ));
    $log[] = 'сводка отправлена';
}

echo $log ? implode('; ', $log) : 'ok';
