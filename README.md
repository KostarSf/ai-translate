# AI Translate

Заготовка расширения для Chrome и Firefox на Vue 3, TypeScript и WXT (Vite).
Оба браузера используют Manifest V3; WXT формирует соответствующий manifest и фоновый скрипт для каждого браузера.

## Запуск

Нужны Node.js 22.12+ и npm.

```sh
npm install
npm run dev
npm run dev:firefox
```

Команды разработки автоматически открывают выбранный браузер с расширением и обновляют его при изменениях.
Если браузер не найден, задайте путь через локальный `web-ext.config.ts` по [инструкции WXT](https://wxt.dev/guide/essentials/config/browser-startup).

## Проверка и сборка

```sh
npm run typecheck
npm run build:all
```

Отдельные сборки: `npm run build` (Chrome) и `npm run build:firefox` (Firefox).
Архивы для распространения: `npm run zip` и `npm run zip:firefox`.

### Chrome

1. Откройте `chrome://extensions` и включите режим разработчика.
2. Нажмите «Загрузить распакованное расширение».
3. Выберите папку `.output/chrome-mv3`.

### Firefox

1. Откройте `about:debugging#/runtime/this-firefox`.
2. Нажмите «Загрузить временное дополнение».
3. Выберите `.output/firefox-mv3/manifest.json`.

Временное дополнение удаляется после перезапуска Firefox. Для постоянной установки потребуется подписанный пакет.
Заготовка ориентирована на Firefox 140+.

## Структура

```text
assets/main.css             Общие стили
entrypoints/background.ts   Фоновые обработчики расширения
entrypoints/popup/          Всплывающее окно на Vue
entrypoints/options/        Страница настроек на Vue
utils/settings.ts           Типы и сохранение настроек
wxt.config.ts               Конфигурация сборки и manifest
```

Popup показывает выбранный язык и открывает настройки. Страница настроек сохраняет язык через `browser.storage.local`.
Сам перевод и подключение к AI API ещё не реализованы.

Для работы с API браузера используйте `import { browser } from 'wxt/browser'`.
Для взаимодействия с веб-страницами можно добавить `entrypoints/content.ts` через `defineContentScript` и указать нужные `matches`.
Разрешения и метаданные задаются в `wxt.config.ts`; сейчас требуется только `storage`.

Перед публикацией замените тестовый Firefox ID `ai-translate@example.org`, добавьте PNG-иконки в `public/icon/`
и обновите описание. Если добавите отправку пользовательских данных, обновите Firefox `data_collection_permissions`
в соответствии с фактическим поведением расширения.

Документация: [WXT](https://wxt.dev/), [Vue](https://vuejs.org/).
