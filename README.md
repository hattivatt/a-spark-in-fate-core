# A Spark in Fate Core

Модуль для **Foundry VTT v13** для совместного создания сеттинга кампании по процедуре **A Spark in Fate Core**.

## Требования

- **Foundry VTT**: v13.340+
- **Система**: [Fate Core Official](https://github.com/Sk1mble/fate-core-official) 4.7+

## Установка

1. Скопируйте папку `a-spark-in-fate-core` в директорию `Data/modules/` вашего Foundry VTT.
2. Включите модуль в настройках мира (**Module Management**).
3. Перезагрузите Foundry.

## Как открыть дашборд

### 1. Кнопка в Scene Controls (рекомендуется)

В левой панели управления сценой (**Scene Controls**) появится новая группа **Spark** с иконкой огня 🔥.

- Нажмите на неё, чтобы открыть дашборд.

### 2. Через макрос

Создайте макрос с типом **Script** и следующим кодом:

```javascript
game.sparkDashboard.open();
```

### 3. Через консоль браузера (для отладки)

```javascript
game.sparkDashboard.open();
```

## Структура дашборда

Дашборд состоит из 7 вкладок, которые отражают этапы создания сеттинга:

1. **Медиа и вдохновения** — добавление источников вдохновения (фильмы, книги, игры) и идей из них.
2. **Жанр и факты** — определение жанра, создание вопросов и установка фактов мира.
3. **Название и искры** — название кампании и создание искр (sparks).
4. **Проблемы** — выбор трёх ключевых проблем кампании (унаследованная, текущая, надвигающаяся).
5. **Действующие лица** — создание сторонников и противников для каждой проблемы.
6. **Локации** — создание локаций, связанных с искрами.
7. **Итог** — сводная страница всего созданного сеттинга.

## Права доступа

| Действие | Мастер | Игрок |
|---|---|---|
| Открыть дашборд | ✅ | ✅ |
| Добавить медиа | ✅ Без лимита | ✅ Максимум 1 |
| Добавить вдохновение | ✅ | ✅ |
| Создать вопрос / искру / проблему / действующее лицо / локацию | ✅ | ❌ |
| Установить факт | ✅ | ✅ (по лимиту) |
| Редактировать / удалить любые данные | ✅ | ❌ |

## Интеграция с Fate Core Official

Модуль умеет:

- Создавать **World Aspects** из жанра, названия кампании и аспектов проблем.
- Создавать **Actors** из карточек действующих лиц.
- Обновлять **Actors** по кнопке из карточки действующего лица.
- Получать список навыков из настроек системы Fate Core Official.

## Локализация

Поддерживаемые языки:

- **English** (`en`)
- **Русский** (`ru`)

## Структура файлов

```
a-spark-in-fate-core/
├── module.json
├── README.md
├── scripts/
│   ├── main.js
│   ├── constants.js
│   ├── settings.js
│   ├── state.js
│   ├── permissions.js
│   ├── fate-core-adapter.js
│   ├── applications/
│   │   ├── dashboard-app.js
│   │   ├── media-dialog.js
│   │   ├── inspiration-dialog.js
│   │   ├── question-dialog.js
│   │   ├── fact-dialog.js
│   │   ├── spark-dialog.js
│   │   ├── place-dialog.js
│   │   ├── face-dialog.js
│   │   └── confirm-delete-dialog.js
│   └── utils/
│       ├── ids.js
│       ├── users.js
│       ├── validation.js
│       └── localization.js
├── templates/
│   ├── dashboard.hbs
│   └── dialogs/
│       ├── media-dialog.hbs
│       ├── inspiration-dialog.hbs
│       ├── question-dialog.hbs
│       ├── fact-dialog.hbs
│       ├── spark-dialog.hbs
│       ├── place-dialog.hbs
│       ├── face-dialog.hbs
│       └── confirm-delete-dialog.hbs
├── styles/
│   └── spark-dashboard.css
└── lang/
    ├── en.json
    └── ru.json
```

## Разработка

Для отладки состояния модуля используйте консоль:

```javascript
// Посмотреть текущее состояние
console.log(game.settings.get("a-spark-in-fate-core", "state"));

// Принудительно открыть дашборд
new game.sparkDashboard.SparkDashboardApp().render(true);
```

## Лицензия

MIT
