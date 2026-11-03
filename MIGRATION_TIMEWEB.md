# Переезд pizza1nt.ru с Beget на Timeweb

Чистый исходник сайта лежит в GitHub (`main`). С взломанного Beget **код не копируем** —
там могут остаться вредоносные файлы. С Beget берём только данные заказов (`orders/*.json`), и то по желанию.

## 1. Timeweb: создать сайт
1. Панель Timeweb → **Сайты** → «Создать сайт» → имя `pizza1nt.ru`.
2. **Домены и поддомены** → «Привязать домен» → `pizza1nt.ru` и `www.pizza1nt.ru` → к сайту `pizza1nt.ru`.
3. **Настройки сайта** → PHP **8.x** (подойдёт любая 7.4+).
4. Корень сайта получится `~/pizza1nt.ru/public_html/`.

## 2. Залить файлы (вариант без SSH — самый быстрый)
1. На GitHub: Code → **Download ZIP** (ветка `main`).
2. Timeweb → **Файловый менеджер** → `pizza1nt.ru/public_html/` → удалить заглушку `index.html`
   → загрузить ZIP → «Распаковать» → перенести содержимое папки `pizza1-nt-main/` прямо в `public_html/`.
3. Не нужны на сервере: `.github/`, `README.md`, `MIGRATION_TIMEWEB.md`.

## 3. Создать `config.local.php` (без него не работают заказы)
В `public_html/` создать файл `config.local.php` по образцу `config.example.php`.
**Так как Beget взломан — все секреты считаем украденными, выпускаем новые:**
- `$TOKEN` — у @BotFather: `/revoke` → новый токен бота;
- `$SECRET` — новая случайная строка (20+ символов, буквы/цифры);
- `$ADMIN_PASS` — новый пароль кабинета кухни;
- `$SMS_KEY` — перевыпустить у SMS-провайдера, если используется;
- `$CHAT_ID`, `$THREAD_*`, `$OWNER_ID` — те же, что были (это не секреты).

Права: `orders/` — 700 (создастся сам), `config.local.php` — 600.

## 4. (Необязательно) перенести заказы и бонусы
С Beget скачать только `pizza1nt.ru/public_html/orders/*.json` (ничего с расширением `.php`!)
и загрузить в `public_html/orders/` на Timeweb.

## 5. DNS — переключить домен на Timeweb
Домен зарегистрирован через Beget (domains.beget.ru), поэтому:
1. domains.beget.ru → домен `pizza1nt.ru` → **DNS-серверы** → заменить на
   `ns1.timeweb.ru`, `ns2.timeweb.ru`, `ns3.timeweb.org`, `ns4.timeweb.org`.
2. Ждать 2–24 часа (обычно 1–3 часа).
3. Сразу смените пароль от аккаунта Beget и включите 2FA — домен пока там.
   Позже можно перенести и регистрацию домена в Timeweb (трансфер).

Если в зоне домена была почта (MX-записи) — переписать их в DNS Timeweb перед сменой NS.

## 6. SSL
Timeweb → **SSL-сертификаты** → бесплатный Let's Encrypt для `pizza1nt.ru` и `www`.
Выпускается только после того, как DNS уже смотрит на Timeweb. `.htaccess` сам перенаправляет на https.

## 7. Telegram-вебхук (кнопки статусов в чате)
После DNS + SSL открыть в браузере (подставить новые TOKEN и SECRET):

    https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://pizza1nt.ru/tg.php&secret_token=<SECRET>

Ответ должен быть `"ok":true`.

## 8. Cron
Timeweb → **Crontab** → задача каждую минуту:

    curl -s https://pizza1nt.ru/cron.php > /dev/null

(или `php ~/pizza1nt.ru/public_html/cron.php`).

## 9. Автодеплой из GitHub (необязательно)
Workflow уже переделан под Timeweb. В GitHub → Settings → Environments → `production` → Secrets:
- `TIMEWEB_HOST` — SSH-хост из панели Timeweb (раздел SSH), напр. `vh123.timeweb.ru`;
- `TIMEWEB_USER` — логин аккаунта (`cXXXXX`);
- `TIMEWEB_SSH_KEY` — приватный ключ ed25519 (публичный добавить в панели Timeweb → SSH);
- `TIMEWEB_KNOWN_HOSTS` — вывод `ssh-keyscan <TIMEWEB_HOST>`.
Старые `BEGET_*` секреты удалить, ключ Beget отозвать.

## 10. Проверка
- https://pizza1nt.ru открывается, меню и картинки грузятся;
- тестовый заказ приходит в Telegram, кнопки статусов работают;
- `kitchen.php` открывается с новым паролем.
