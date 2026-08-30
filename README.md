# Пицца №1 — Нижний Тагил

Production-исходники сайта [pizza1nt.ru](https://pizza1nt.ru) и автоматический деплой на Beget.

## Production

- Ветка: `main`
- Сервер: Beget
- Каталог: `pizza1nt.ru/public_html/`
- Деплой: GitHub Actions (`.github/workflows/deploy.yml`)

Каждый push или merge в `main` запускает резервное копирование текущего сайта, синхронизацию файлов по SSH/rsync и проверку production-копии.

## Обычная работа

1. Получить свежую ветку `main`.
2. Внести и локально проверить правку.
3. Создать commit с понятным сообщением.
4. Отправить commit в `main`.
5. Дождаться зелёного результата workflow **Deploy main to Beget**.

## Секреты и runtime-данные

В Git не попадают:

- `config.local.php` — Telegram/API-настройки и пароль кабинета;
- `orders/` — заказы и бонусные данные клиентов;
- `.env*`, журналы, базы и резервные копии.

Пример структуры конфигурации находится в `config.example.php`. Production-файлы `config.local.php`, `orders/`, `.well-known/` и `cgi-bin/` сохраняются при каждом деплое.
