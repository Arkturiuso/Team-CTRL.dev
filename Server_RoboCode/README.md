# RoboCode API Documentation

## Как запустить

1. Установите [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Откройте терминал в папке проекта
3. Выполните команду:
   ```bash
   docker compose up -d --build
4. API будет доступен по адресу: http://localhost:7085/swagger
5. База данных доступна на порту 3307 (localhost:3307)



Этот документ описывает структуру API для приложения RoboCode. Все ответы сервера обёрнуты в единый формат `ApiResponse`.

---

## Общий формат ответа (ApiResponse)

Все контроллеры возвращают данные в следующем формате:

```json
{
  "success": true,          // boolean: Успешно ли выполнен запрос
  "message": "Описание",    // string: Сообщение от сервера (ошибка или успех)
  "data": { ... },          // object|null: Полезные данные (зависит от эндпоинта)
  "timestamp": "2026-10-10T12:00:00Z"  // DateTime: Время ответа сервера (UTC)
}
```

---

## 1. Авторизация и Регистрация

### POST `/api/auth/login`

Авторизует пользователя и выдаёт токены доступа.

**Request Body:**

```json
{
  "login": "string",     // Логин пользователя (max 64 символа)
  "password": "string"   // Пароль (max 255 символов)
}
```

**Response Data** (`data` field):

```json
{
  "userId": 1,                    // int: ID пользователя
  "login": "admin",               // string: Логин
  "roleId": 1,                    // int: ID роли (1 = Player, 2 = Admin)
  "roleName": "player",           // string: Название роли
  "registration": "2026-10-01T10:00:00",  // DateTime: Дата регистрации
  "tokens": {                     // TokenResponse: Объект с токенами
    "refreshToken": "eyJhbG...",  // string: Токен обновления (длинная строка)
    "expiresAt": "2026-10-17T10:00:00"  // DateTime: Срок действия токена
  }
}
```

### POST `/api/register`

Регистрирует нового игрока. Автоматически создаёт запись в статистике и лидерборде.

**Request Body:**

```json
{
  "login": "new_player",  // string: Уникальный логин
  "password": "pass123"   // string: Пароль
}
```

**Response Data** (`data` field):

```json
{
  "userId": 5,                    // int: ID нового пользователя
  "login": "new_player",          // string: Логин
  "registration": "2026-10-10T12:00:00",  // DateTime: Дата создания
  "roleId": 1,                    // int: Роль по умолчанию (Player)
  "tokens": {                     // TokenResponse: Начальные токены
    "refreshToken": "eyJhbG...",
    "expiresAt": "2026-10-17T12:00:00"
  }
}
```

---

## 2. Профиль Игрока

### GET `/api/profile`

Возвращает полную информацию о профиле авторизованного пользователя.  
**Требует заголовок:** `Authorization: Bearer <token>`.

**Response Data** (`data` field) — объект типа `ProfileResponse`:

```json
{
  "user": {                           // UserInfo: Основная информация
    "login": "admin",                 // string: Логин
    "registrationDate": "2026-10-01T10:00:00",  // DateTime: Дата регистрации
    "accountStatusName": "Активен",   // string: Статус аккаунта (рус.)
    "role": "admin",                  // string: Роль ("player" или "admin")
    "totalStars": 150,                // int: Количество звёзд (очки)
    "levelsPassedCount": 12           // int: Количество пройденных уровней
  },
  "stats": {                          // UserStats: Детальная статистика
    "totalScore": 1500,               // int: Общий счёт
    "levelsPassed": 12,               // int: Пройдено уровней
    "lastUpdate": "2026-10-10T11:50:00"  // DateTime: Последнее обновление статистики
  },
  "rankPosition": 3,                  // int|null: Место в лидерборде (null если нет места)
  "recentAttempts": [                 // List<AttemptHistoryItem>: Последние 10 попыток
    {
      "levelId": 5,                   // int: ID уровня
      "levelTitle": "Лабиринт забытого храма",  // string: Название уровня (из JSON)
      "submittedAt": "2026-10-10T11:45:00",     // DateTime: Время попытки
      "statusName": "Успех",          // string: Статус попытки (рус.)
      "tickCount": 1200,              // int: Количество тиков (время выполнения)
      "isSuccess": true               // boolean: Была ли попытка успешной
    }
  ]
}
```

---

## Технические детали

### Типы данных

| Тип C#     | Тип JSON  | Описание                                      |
|------------|-----------|-----------------------------------------------|
| `int`      | `number`  | Целые числа (ID, счётчики)                    |
| `string`   | `string`  | Текст (логины, статусы, токены)               |
| `bool`     | `boolean` | Логические значения (`true`/`false`)          |
| `DateTime` | `string`  | Дата и время в формате ISO 8601 (`YYYY-MM-DDTHH:mm:ss`) |
| `object`   | `object`  | Вложенные объекты (User, Stats, Tokens)       |
| `list`     | `array`   | Массивы объектов (RecentAttempts)             |

### Коды ответов HTTP

| Код | Описание |
|-----|----------|
| **200** OK | Запрос выполнен успешно |
| **201** Created | Пользователь успешно зарегистрирован |
| **400** Bad Request | Ошибка валидации (пустой логин, короткий пароль) |
| **401** Unauthorized | Неверный логин/пароль или отсутствующий токен |
| **403** Forbidden | Аккаунт заблокирован |
| **404** Not Found | Профиль или ресурс не найден |
| **409** Conflict | Логин уже занят при регистрации |
| **500** Internal Server Error | Ошибка на стороне сервера (проблемы с БД) |

### Примечания

1. **Парсинг JSON**: Поле `levelTitle` в истории попыток извлекается автоматически из JSON-поля `map_data` таблицы `level`.
2. **Статусы**: Поля `accountStatusName` и `statusName` возвращаются сразу на русском языке для удобства отображения в UI.
3. **Безопасность**: Пароли никогда не возвращаются в ответах API.

---

## Что есть в этом документе

1. **Чёткая структура** — разделено по контроллерам (Auth, Register, Profile).
2. **Примеры JSON** — можно просто скопировать и вставить в Postman/Swagger.
3. **Типы данных** — таблица в конце объясняет, что значит `int`, `string`, `DateTime`.
4. **Описание полей** — каждое поле прокомментировано (например, что `rankPosition` может быть `null`).

Теперь любой разработчик (или ты сам через месяц) откроет этот файл и сразу поймёт, как работать с API.
