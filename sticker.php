<?php
/* ============================================================
   Стикер-бегунок на кухню. Ширина 80 мм, термопринтер.
   Это НЕ фискальный чек — производственный бегунок для кухни.
   ============================================================ */
require dirname(__FILE__) . '/lib.php';

session_name('pzkitchen');
session_start();

header('X-Robots-Tag: noindex');
if (empty($_SESSION['kit'])) { http_response_code(403); exit('403'); }

$o = order_load(isset($_GET['k']) ? $_GET['k'] : '');
if (!$o) { http_response_code(404); exit('404'); }

function e($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
$pickup = ($o['fulfil'] === 'pickup');
?><!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><title>Заказ <?php echo (int) $o['no']; ?></title>
<style>
@page { size: 80mm auto; margin: 0; }
html, body { margin:0; padding:0; background:#fff; color:#000; }
body { width:80mm; font:13px/1.3 Arial, Helvetica, sans-serif; padding:4mm 3mm 8mm; }
.no { font-size:30px; font-weight:800; text-align:center; letter-spacing:1px; }
.kind { text-align:center; font-size:16px; font-weight:700; margin:1mm 0 2mm; }
.time { text-align:center; font-size:12px; }
hr { border:0; border-top:1px dashed #000; margin:2mm 0; }
.it { font-size:16px; font-weight:700; margin:1.2mm 0; }
.it span { font-size:18px; }
.sum { font-size:15px; font-weight:800; text-align:right; margin-top:1mm; }
.addr { font-size:14px; line-height:1.35; }
.addr b { font-size:15px; }
.foot { font-size:11px; text-align:center; margin-top:2mm; }
</style></head>
<body>

<div class="no">&#8470;<?php echo (int) $o['no']; ?></div>
<div class="kind"><?php echo $pickup ? 'САМОВЫВОЗ' : 'ДОСТАВКА'; ?></div>
<div class="time">принят <?php echo date('d.m H:i', (int) $o['created']); ?> &middot; печать <?php echo date('H:i'); ?></div>

<hr>
<?php foreach ($o['items'] as $it): ?>
<div class="it"><span><?php echo (int) $it['qty']; ?>&times;</span> <?php echo e($it['name']); ?></div>
<?php endforeach; ?>
<?php if (!empty($o['slices'])): ?>
<div class="time" style="text-align:left">порций: <?php echo (int) $o['slices']; ?><?php if (!empty($o['box'])) { echo ' &middot; упаковка ' . (int) $o['box'] . ' P'; } ?></div>
<?php endif; ?>
<div class="sum">ИТОГО: <?php echo (int) $o['total']; ?> P<?php echo $o['pay'] !== '' ? ' &middot; ' . e($o['pay']) : ''; ?></div>

<hr>
<div class="addr">
<b><?php echo e($o['name']); ?></b><br>
<?php echo e($o['phone']); ?><br>
<?php if ($pickup): ?>
Самовывоз &mdash; Куйбышева, 14
<?php else: ?>
<b><?php echo e($o['addr']); ?></b>
<?php if (!empty($o['zone'])): ?><br><?php echo e($o['zone']); ?><?php endif; ?>
<?php endif; ?>
<?php if ($o['payer'] === 'company' && !empty($o['company'])): ?>
<br>&#127970; <?php echo e($o['company']); ?>
<?php endif; ?>
</div>

<hr>
<div class="foot">Пицца &#8470;1 &middot; Куйбышева 14 &middot; +7 912 609-77-00<br>бегунок кухни, не кассовый чек</div>

<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>
