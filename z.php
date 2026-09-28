<?php
require dirname(__FILE__) . '/lib.php';

$key = isset($_GET['k']) ? $_GET['k'] : '';
$o   = order_load($key);

$STEPS = array(
    array('new',        'Заказ принят',   'Мы получили заказ'),
    array('accepted',   'Подтверждён',    'Оператор проверил состав'),
    array('cooking',    'Готовится',      'Пицца в печи'),
    array('delivering', 'Курьер в пути',  'Везём вам'),
    array('done',       'Доставлен',      'Приятного аппетита')
);
if ($o && $o['fulfil'] === 'pickup') {
    $STEPS[3] = array('ready', 'Готов к выдаче', 'Ждём вас на Куйбышева, 14');
    $STEPS[4] = array('done',  'Выдан',          'Приятного аппетита');
}
$order_idx = array();
foreach ($STEPS as $i => $s) { $order_idx[$s[0]] = $i; }
$cur = ($o && isset($order_idx[$o['status']])) ? $order_idx[$o['status']] : 0;
$cancelled = ($o && $o['status'] === 'cancelled');
?><!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title><?php echo $o ? 'Заказ №' . $o['no'] : 'Заказ не найден'; ?> — Пицца №1</title>
<link rel="stylesheet" href="styles.css">
<?php if ($o && !$cancelled && $o['status'] !== 'done'): ?>
<meta http-equiv="refresh" content="25">
<?php endif; ?>
</head>
<body>

<header class="head"><div class="head__in">
  <a class="brand" href="/"><img class="brand__mark" src="logo.png" alt="" height="46">
  <span class="brand__txt"><b>ПИЦЦА №1</b></span></a>
</div></header>

<main class="zmain">
<?php if (!$o): ?>
  <h1 class="zh1">Заказ не найден</h1>
  <p class="zlead">Проверьте ссылку или позвоните нам: +7 912 609-77-00</p>
<?php else: ?>
  <p class="zeyebrow">Заказ №<?php echo $o['no']; ?> от <?php echo date('d.m.Y H:i', $o['created']); ?></p>
  <h1 class="zh1"><?php echo $cancelled ? 'Заказ отменён' : $STEPS[$cur][1]; ?></h1>
  <p class="zlead"><?php echo $cancelled ? 'Позвоните нам, если это ошибка.' : $STEPS[$cur][2]; ?></p>

  <?php if (!$cancelled): ?>
  <ol class="zsteps">
    <?php foreach ($STEPS as $i => $s): ?>
    <li class="zstep <?php echo $i < $cur ? 'is-done' : ($i === $cur ? 'is-now' : ''); ?>">
      <span class="zdot"></span>
      <span class="zname"><?php echo $s[1]; ?></span>
      <span class="ztime"><?php echo isset($o['history'][$s[0]]) ? date('H:i', $o['history'][$s[0]]) : ''; ?></span>
    </li>
    <?php endforeach; ?>
  </ol>
  <?php endif; ?>

  <div class="zcard">
    <h2>Состав заказа</h2>
    <?php foreach ($o['items'] as $it): ?>
      <div class="zrow"><span><?php echo $it['name']; ?> × <?php echo $it['qty']; ?></span><b><?php echo money($it['sum']); ?></b></div>
    <?php endforeach; ?>
    <?php if (!empty($o['disc'])): ?><div class="zrow zrow--ok"><span>Самовывоз −10%</span><b>−<?php echo money($o['disc']); ?></b></div><?php endif; ?>
    <?php if (!empty($o['promo'])): ?><div class="zrow zrow--ok"><span>Промокод</span><b>−<?php echo money($o['promo']); ?></b></div><?php endif; ?>
    <div class="zrow"><span>Доставка</span><b><?php echo $o['ship'] > 0 ? money($o['ship']) : 'бесплатно'; ?></b></div>
    <div class="zrow zrow--total"><span>Итого</span><b><?php echo money($o['total']); ?></b></div>
    <?php if (!empty($o['bonus'])): ?>
      <p class="zbonus">Начислено <?php echo $o['bonus']; ?> бонусов — спишете со следующего заказа.</p>
    <?php endif; ?>
  </div>

  <div class="zcard">
    <h2><?php echo $o['fulfil'] === 'pickup' ? 'Самовывоз' : 'Доставка'; ?></h2>
    <?php if ($o['fulfil'] === 'pickup'): ?>
      <p>Нижний Тагил, ул. Куйбышева, 14</p>
    <?php else: ?>
      <p><?php echo $o['addr']; ?><?php if (!empty($o['zone'])) echo ' · ' . $o['zone']; ?></p>
    <?php endif; ?>
    <p class="zmuted">Оплата: <?php echo $o['pay']; ?></p>
  </div>

  <p class="zfoot">Вопросы по заказу — <a href="tel:+79126097700">+7 912 609-77-00</a></p>
<p class="zfoot zback"><a href="/">← Вернуться в меню</a></p>
<?php endif; ?>
</main>
<?php if ($o): ?>
<script>
/* запоминаем заказ в браузере — на главной вместо корзины покажется его статус */
(function () {
  try {
    var k = <?php echo json_encode($o['key']); ?>;
    var cur = null;
    try { cur = JSON.parse(localStorage.getItem('pizza1_order')); } catch (e) {}
    if (!cur || cur.key !== k) {
      localStorage.setItem('pizza1_order', JSON.stringify({
        key: k, no: <?php echo (int) $o['no']; ?>, url: location.pathname + '?k=' + k,
        status: <?php echo json_encode($o['status']); ?>,
        label: <?php echo json_encode($cancelled ? 'Отменён' : $STEPS[$cur][1]); ?>,
        created: <?php echo ((int) $o['created']) * 1000; ?>,
        final: <?php echo ($cancelled || $o['status'] === 'done') ? 'true' : 'false'; ?>,
        finalAt: Date.now()
      }));
    }
  } catch (e) {}
})();
</script>
<?php endif; ?>
</body>
</html>
