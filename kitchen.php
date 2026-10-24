<?php
/* ============================================================
   Кухонная доска заказов. Отдельный вход, отдельная сессия.
   Пароль: $KITCHEN_PASS в config.local.php.
   Если он не задан — работает пароль кабинета, но с предупреждением.
   ============================================================ */
require dirname(__FILE__) . '/lib.php';

session_name('pzkitchen');
session_start();

header('X-Robots-Tag: noindex');

/* Временный пароль смены. Как только в config.local.php появится
   $KITCHEN_PASS — он перекроет эту строку, и её можно удалить. */
$TEMP_PASS = '1pizza';

$OWN_PASS = isset($KITCHEN_PASS) && $KITCHEN_PASS !== '';
$PASS = $OWN_PASS ? $KITCHEN_PASS : $TEMP_PASS;

if (isset($_POST['pass'])) {
    /* телефонные клавиатуры любят дописывать пробел и неразрывный пробел */
    $try = str_replace(array("\xc2\xa0", ' ', "\t"), '', (string) $_POST['pass']);
    $ref = trim((string) $PASS);
    if ($try !== '' && hash_equals($ref, $try)) {
        session_regenerate_id(true);
        $_SESSION['kit'] = 1;
        $_SESSION['who'] = mb_substr(trim(strip_tags((string) (isset($_POST['who']) ? $_POST['who'] : ''))), 0, 30);
        header('Location: kitchen.php'); exit;
    }
    $_SESSION['err'] = 1;
    header('Location: kitchen.php'); exit;
}
if (isset($_GET['out'])) { session_destroy(); header('Location: kitchen.php'); exit; }

if (empty($_SESSION['kit'])) {
$ERR = !empty($_SESSION['err']);
unset($_SESSION['err']);
$COOKIE_OK = !empty($_COOKIE[session_name()]);
?><!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Кухня — Пицца №1</title>
<link rel="stylesheet" href="kitchen.css?v=4">
</head><body class="klogin">
<form method="post" class="kloginbox">
<img src="logo.png" alt="" height="56">
<h1>Кухня</h1>
<?php if ($ERR): ?><p class="kerr">Неверный пароль. Проверьте раскладку и регистр.</p><?php endif; ?>
<?php if ($ERR && !$COOKIE_OK): ?><p class="kerr">Браузер не сохраняет cookie — вход не удержится. Откройте страницу в обычном окне, не в приватном.</p><?php endif; ?>
<label for="w">Смена (необязательно)</label>
<input id="w" name="who" type="text" autocomplete="off" placeholder="Имя или смена">
<label for="p">Пароль</label>
<input id="p" name="pass" type="password" autocomplete="current-password" autofocus>
<button type="submit">Войти</button>
</form>
</body></html><?php exit; }

$WHO = isset($_SESSION['who']) ? $_SESSION['who'] : '';
?><!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#14110f">
<title>Кухня — Пицца №1</title>
<link rel="stylesheet" href="kitchen.css?v=4">
</head><body data-warn1="20" data-warn2="35"<?php if (!$OWN_PASS) { echo ' data-nopass="1"'; } ?>>

<header class="ktop">
  <button class="kbtn kbtn--sound" id="sound" title="Звук новых заказов">🔇 Звук выключен</button>
  <div class="kday">
    <button class="kbtn" id="prevDay">◀</button>
    <button class="kbtn kbtn--day" id="dayBtn">Сегодня</button>
    <button class="kbtn" id="nextDay">▶</button>
  </div>
  <div class="kspacer"></div>
  <div class="kclock" id="clock">--:--</div>
  <div class="kstate" id="state" title="Связь с сервером">●</div>
  <?php if ($WHO !== ''): ?><div class="kwho"><?php echo htmlspecialchars($WHO, ENT_QUOTES, 'UTF-8'); ?></div><?php endif; ?>
  <a class="kbtn" href="?out=1">Выход</a>
</header>

<?php if (!$OWN_PASS): ?>
<div class="kwarn">Работает временный пароль из кода. Задайте <b>$KITCHEN_PASS</b> в config.local.php — и это предупреждение пропадёт.</div>
<?php endif; ?>

<div class="kalarm" id="alarm" hidden>НОВЫЙ ЗАКАЗ — нажмите, чтобы выключить сигнал</div>

<main class="kboard" id="board"></main>

<div class="ksheet" id="sheet" hidden>
  <div class="ksheet__bg" data-close="1"></div>
  <div class="ksheet__box" id="sheetBox"></div>
</div>

<div class="kdays" id="daysPanel" hidden>
  <div class="ksheet__bg" data-close="1"></div>
  <div class="kdays__box" id="daysBox"></div>
</div>

<iframe id="printer" title="печать" style="position:fixed;width:0;height:0;border:0;left:-9999px"></iframe>

<script src="kitchen.js?v=4"></script>
</body></html>
