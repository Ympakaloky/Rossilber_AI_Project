# Управление Google Таблицей через сайт на Netlify

Проект: сайт (HTML/CSS/JS) + Netlify Function, которая читает и изменяет данные
в Google Таблице с колонками **Партия | Продукт | Количество**.

## Структура проекта

```
sheet-project/
├── index.html
├── style.css
├── script.js
├── package.json
├── netlify.toml
└── netlify/
    └── functions/
        └── sheet.js
```

## Шаг 1. Подготовьте Google Таблицу

1. Создайте Google Таблицу (или используйте существующую).
2. В первой строке (заголовки) сделайте: `Партия | Продукт | Количество`.
   Данные должны идти с A2.
3. Скопируйте ID таблицы из URL:
   `https://docs.google.com/spreadsheets/d/ЭТО_ID_ТАБЛИЦЫ/edit`

## Шаг 2. Создайте Service Account в Google Cloud

1. Зайдите в [Google Cloud Console](https://console.cloud.google.com/).
2. Создайте новый проект (или выберите существующий).
3. В меню **APIs & Services → Library** включите **Google Sheets API**.
4. В **APIs & Services → Credentials** нажмите **Create Credentials → Service Account**.
5. Дайте ему имя, создайте.
6. Откройте созданный service account → вкладка **Keys** → **Add Key → Create new key → JSON**.
   Скачается файл `.json` — он понадобится дальше. **Никому его не показывайте и не коммитьте в GitHub.**
7. В этом JSON-файле есть поля `client_email` и `private_key` — они нужны для переменных окружения.

## Шаг 3. Дайте service account доступ к таблице

1. Откройте Google Таблицу → кнопка **Настройки доступа (Share)**.
2. Добавьте email service account (поле `client_email` из JSON,
   выглядит как `xxx@xxx.iam.gserviceaccount.com`) с правом **Редактор**.

## Шаг 4. Загрузите проект в GitHub

```bash
cd sheet-project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
git push -u origin main
```

⚠️ Файл с ключом service account (JSON) **не кладите в репозиторий** — все секреты
передаются через переменные окружения Netlify (см. следующий шаг).

## Шаг 5. Разверните на Netlify

1. Зайдите на [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Подключите ваш GitHub-репозиторий.
3. Настройки сборки можно оставить пустыми (build command не нужен, publish directory — `.`).
4. Перед первым деплоем (или после) зайдите в **Site configuration → Environment variables**
   и добавьте:

   | Переменная | Значение |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | значение поля `client_email` из JSON |
   | `GOOGLE_PRIVATE_KEY` | значение поля `private_key` из JSON (целиком, вместе с `-----BEGIN PRIVATE KEY-----...`) |
   | `SPREADSHEET_ID` | ID вашей таблицы |
   | `SHEET_NAME` | название листа, например `Sheet1` или `Лист1` (по умолчанию `Sheet1`) |

5. Запустите деплой (Deploy site / Trigger deploy).

## Шаг 6. Проверка

После деплоя откройте сайт — вы должны увидеть таблицу с данными из Google Sheets,
форму для добавления строк и кнопки «Изменить» / «Удалить» у каждой строки.

## Локальная разработка (опционально)

Если хотите тестировать функции локально:

```bash
npm install
npm install -g netlify-cli
netlify dev
```

Создайте файл `.env` (добавьте в `.gitignore`!) с теми же переменными,
что и в шаге 5, — `netlify dev` подхватит их автоматически.
