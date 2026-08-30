<?php
require dirname(__FILE__) . '/lib.php';
session_start();

if (isset($_POST['pass'])) {
    if ($_POST['pass'] === $ADMIN_PASS) { $_SESSION['adm'] = 1; }
    header('Location: admin.php'); exit;
}
if (isset($_GET['out'])) { session_destroy(); header('Location: admin.php'); exit; }

if (empty($_SESSION['adm'])) { ?><!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Вход</title>
<link rel="stylesheet" href="styles.css"></head><body>
<main class="zmain" style="max-width:380px">
  <h1 class="zh1">Кабинет</h1>
  <form method="post" class="zcard">
    <div class="field"><label for="p">Пароль</label><input id="p" name="pass" type="password" autofocus></div>
    <button class="pill pill--amber" style="width:100%;margin-top:8px">Войти</button>
  </form>
</main></body></html><?php exit; }

if (isset($_POST['set']) && isset($_POST['key'])) {
    $o = order_load($_POST['key']);
    if ($o) { order_set_status($o, $_POST['set'], 'кабинет'); }
    header('Location: admin.php' . (isset($_GET['all']) ? '?all=1' : '')); exit;
}

$all   = isset($_GET['all']);
$list  = orders_all();
$today = strtotime('today');
if (!$all) {
    $list = array_values(array_filter($list, function ($o) use ($today) { return $o['created'] >= $today; }));
}

$sum = 0; $done = 0; $secs = array();
foreach ($list as $o) {
    if ($o['status'] === 'cancelled') { continue; }
    $sum += $o['total'];
    if ($o['status'] === 'done') {
        $done++;
        if (isset($o['history']['new'], $o['history']['done'])) {
            $secs[] = $o['history']['done'] - $o['history']['new'];
        }
    }
}
$cnt = count($list);
$avg = $cnt ? round($sum / $cnt) : 0;
$mid = $secs ? round(array_sum($secs) / count($secs) / 60) : 0;

$NEXT = array(
    'new'        => array('accepted' => 'Подтвердить', 'cancelled' => 'Отменить'),
    'accepted'   => array('cooking' => 'В печь'),
    'cooking'    => array('delivering' => 'Курьеру', 'ready' => 'Готов к выдаче'),
    'delivering' => array('done' => 'Доставлен'),
    'ready'      => array('done' => 'Выдан')
);
?><!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Кабинет — Пицца №1</title>
<link rel="stylesheet" href="styles.css">
<meta http-equiv="refresh" content="40">
</head><body>

<header class="head"><div class="head__in">
  <a class="brand" href="/"><img class="brand__mark" src="logo.png" alt="" height="46">
  <span class="brand__txt"><b>ПИЦЦА №1</b></span></a>
  <div class="head__act"><a class="pill pill--dark" href="?out=1">Выйти</a></div>
</div></header>

<main class="amain">
  <div class="astats">
    <div class="astat"><b><?php echo $cnt; ?></b><span>заказов<?php echo $all ? ' всего' : ' сегодня'; ?></span></div>
    <div class="astat"><b><?php echo money($sum); ?></b><span>выручка</span></div>
    <div class="astat"><b><?php echo money($avg); ?></b><span>средний чек</span></div>
    <div class="astat"><b><?php echo $mid ? $mid . ' мин' : '—'; ?></b><span>среднее время (<?php echo $done; ?>)</span></div>
  </div>

  <div class="atabs">
    <a class="pill <?php echo $all ? 'pill--dark' : 'pill--amber'; ?>" href="admin.php">Сегодня</a>
    <a class="pill <?php echo $all ? 'pill--amber' : 'pill--dark'; ?>" href="?all=1">Все заказы</a>
  </div>

<?php if (!$list): ?>
  <p class="zlead">Заказов пока нет.</p>
<?php endif; ?>

<?php foreach ($list as $o): $st = $o['status']; ?>
  <div class="acard<?php echo $st === 'done' ? ' is-done' : ($st === 'cancelled' ? ' is-cancel' : ''); ?>">
    <div class="ahead">
      <b>№<?php echo $o['no']; ?></b>
      <span class="abadge"><?php echo $STATUSES[$st]; ?></span>
      <span class="atime"><?php echo date('d.m H:i', $o['created']); ?></span>
      <b class="asum"><?php echo money($o['total']); ?></b>
    </div>

    <div class="abody">
      <?php foreach ($o['items'] as $it): ?>
        <div class="arow"><?php echo $it['name']; ?> × <?php echo $it['qty']; ?></div>
      <?php endforeach; ?>
      <p class="amuted">
        <?php echo $o['name']; ?> · <a href="tel:<?php echo preg_replace('/\D/', '', $o['phone']); ?>"><?php echo $o['phone']; ?></a><br>
        <?php echo $o['fulfil'] === 'pickup' ? 'Самовывоз' : $o['addr'] . ($o['zone'] ? ' · ' . $o['zone'] : ''); ?><br>
        <?php echo $o['pay']; ?>
      </p>
      <?php if (!empty($o['history'])): ?>
        <p class="amuted asteps">
        <?php foreach ($o['history'] as $k => $ts): ?>
          <span><?php echo $STATUSES[$k]; ?> <?php echo date('H:i', $ts); ?></span>
        <?php endforeach; ?>
        </p>
      <?php endif; ?>
    </div>

    <?php if (isset($NEXT[$st])): ?>
    <div class="aacts">
      <?php foreach ($NEXT[$st] as $to => $label):
        if ($to === 'ready'      && $o['fulfil'] !== 'pickup') continue;
        if ($to === 'delivering' && $o['fulfil'] === 'pickup') continue; ?>
        <form method="post" style="display:inline">
          <input type="hidden" name="key" value="<?php echo $o['key']; ?>">
          <input type="hidden" name="set" value="<?php echo $to; ?>">
          <button class="pill <?php echo $to === 'cancelled' ? 'pill--dark' : 'pill--amber'; ?>"><?php echo $label; ?></button>
        </form>
      <?php endforeach; ?>
      <a class="alink" href="z.php?k=<?php echo $o['key']; ?>" target="_blank">Страница клиента</a>
    </div>
    <?php endif; ?>
  </div>
<?php endforeach; ?>
</main>
</body></html>
