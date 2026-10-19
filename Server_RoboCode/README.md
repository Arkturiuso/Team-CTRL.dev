# RoboCode API Documentation

## Как запустить

1. Установите [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Откройте терминал в папке проекта
3. Выполните команду:
   ```bash
   docker compose up -d --build
   ```
4. API будет доступен по адресу: http://localhost:7085/swagger
5. База данных доступна на порту 3307 (localhost:3307)

---

Все ответы сервера обёрнуты в единый формат `ApiResponse`:

```json
{
  "success": true,
  "message": "Описание",
  "data": { ... },
  "timestamp": "2026-10-10T12:00:00Z"
}
```

---

## 1. Авторизация

### POST `/api/auth/login`

**Входные данные (Body, JSON):**

| Поле       | Тип    | Обязательное | Ограничения      | Описание |
|------------|--------|--------------|------------------|----------|
| `login`    | string | да           | max 64 символа   | Логин    |
| `password` | string | да           | max 255 символов | Пароль   |

```json
{
  "login": "admin",
  "password": "admin123"
}
```

**Ответ (`data`):**

```json
{
  "userId": 1,
  "login": "admin",
  "role": "admin",
  "tokens": {
    "refreshToken": "...",
    "expiresAt": "2026-10-17T10:00:00"
  }
}
```

**Коды:** 200, 400, 401, 403, 500

---

## 2. Регистрация

### POST `/api/register`

**Входные данные (Body, JSON):**

| Поле       | Тип    | Обязательное | Ограничения        | Описание |
|------------|--------|--------------|--------------------|----------|
| `login`    | string | да           | max 64, уникальный | Логин    |
| `password` | string | да           | max 255 символов   | Пароль   |

```json
{
  "login": "new_player",
  "password": "pass123"
}
```

**Ответ (`data`):**

```json
{
  "userId": 5,
  "login": "new_player",
  "role": "player",
  "registration": "2026-10-10T12:00:00",
  "tokens": {
    "refreshToken": "...",
    "expiresAt": "2026-10-17T12:00:00"
  }
}
```

**Коды:** 201, 400, 409, 500

---

## 3. Профиль игрока

### GET `/api/profile`

**Входные данные:**

| Источник               | Обязательное | Описание                             |
|------------------------|--------------|--------------------------------------|
| Header `Authorization` | да           | `Bearer <token>`                     |
| Body / Query / Path    | нет          | ID пользователя берётся из токена    |

**Ответ (`data`) — ProfileResponse:**

```json
{
  "user": {
    "login": "admin",
    "registrationDate": "2026-10-01T10:00:00",
    "accountStatusName": "Активен",
    "role": "admin",
    "totalStars": 150,
    "levelsPassedCount": 12
  },
  "stats": {
    "totalScore": 1500,
    "levelsPassed": 12,
    "lastUpdate": "2026-10-10T11:50:00"
  },
  "rankPosition": 3,
  "recentAttempts": [
    {
      "levelId": 5,
      "levelTitle": "Лабиринт забытого храма",
      "submittedAt": "2026-10-10T11:45:00",
      "statusName": "Успех",
      "tickCount": 1200,
      "isSuccess": true
    }
  ]
}
```

**Коды:** 200, 401, 404, 500

---

## 4. Уровни

### GET `/api/level`

Список всех уровней.

**Входные данные:** нет (обязательной авторизации нет).

Если передан заголовок `Authorization: Bearer <token>`, в каждом уровне заполняется поле `userStars` — оценка текущего пользователя (0–3).  
Без токена у всех уровней `userStars: 0`.

**Ответ (`data`) — массив LevelResponse:**

```json
[
  {
    "levelId": 1,
    "mapData": {
      "exit": "I9",
      "keys": [ ... ],
      "walls": [ ... ],
      "width": 9,
      "height": 9,
      "entrance": "A1",
      "keys_count": 3,
      "level_name": "Лабиринт забытого храма",
      "description": "Древний храм с запутанными коридорами"
    },
    "levelName": "Лабиринт забытого храма",
    "description": "Древний храм с запутанными коридорами",
    "width": 9,
    "height": 9,
    "difficultyId": 2,
    "difficultyName": "Средний",
    "levelStatusId": 1,
    "levelStatusName": "Доступен",
    "created": "2026-10-05T09:11:00",
    "userStars": 2
  }
]
```

**Коды:** 200, 500

---

### GET `/api/level/{id}`

Один уровень по ID.

**Входные данные (Path):**

| Параметр | Тип | Обязательное | Описание  |
|----------|-----|--------------|-----------|
| `id`     | int | да           | ID уровня |

Опционально: `Authorization: Bearer <token>` — тогда в ответе будет реальный `userStars`, иначе `0`.

**Ответ (`data`)** — один объект LevelResponse (структура как элемент массива выше).

**Коды:** 200, 404, 500

---

### POST `/api/level`

Создание нового уровня.

**Входные данные (Body, JSON):**

| Поле            | Тип    | Обязательное | Описание |
|-----------------|--------|--------------|----------|
| `mapData`       | object | да           | Полный JSON карты (level_name, width, height, entrance, exit, keys, walls и т.д.) |
| `difficultyId`  | int    | да           | 1=easy, 2=medium, 3=hard, 4=expert |
| `levelStatusId` | int    | нет          | 1=available, 2=blocked, 3=hidden (по умолчанию 1) |

```json
{
  "mapData": {
    "exit": "I9",
    "keys": [
      { "id": 1, "position": "B2" },
      { "id": 2, "position": "E5" },
      { "id": 3, "position": "H8" }
    ],
    "walls": [
      { "id": 1, "side1": "A1-A3", "side2": "B1-B3" }
    ],
    "width": 9,
    "height": 9,
    "entrance": "A1",
    "keys_count": 3,
    "level_name": "Лабиринт забытого храма",
    "description": "Древний храм с запутанными коридорами"
  },
  "difficultyId": 2,
  "levelStatusId": 1
}
```

**Коды:** 201, 400, 500

---

### Поля LevelResponse

| Поле              | Тип          | Описание |
|-------------------|--------------|----------|
| `levelId`         | int          | ID уровня |
| `mapData`         | object       | Полный JSON карты |
| `levelName`       | string       | Название (из map_data.level_name) |
| `description`     | string\|null | Описание |
| `width`           | int\|null    | Ширина карты |
| `height`          | int\|null    | Высота карты |
| `difficultyId`    | int          | ID сложности |
| `difficultyName`  | string       | Сложность на русском |
| `levelStatusId`   | int          | ID статуса |
| `levelStatusName` | string       | Статус на русском |
| `created`         | DateTime     | Дата создания |
| `userStars`       | int          | **Звёзды текущего пользователя (0–3).** 0 = уровень не проходили или токен не передан. Берётся из `result.total_score` |

---

## 5. Таблица лидеров

### GET `/api/leaderboard`

Рейтинг игроков с **пагинацией**.  
Место считается по **сумме звёзд** за все пройденные уровни (`SUM(result.total_score)`).  
При равенстве звёзд выше тот, у кого больше пройденных уровней.

**Входные данные (Query):**

| Параметр   | Тип | Обязательное | По умолчанию | Описание |
|------------|-----|--------------|--------------|----------|
| `page`     | int | нет          | 1            | Номер страницы (с 1) |
| `pageSize` | int | нет          | 10           | Игроков на странице (макс. 50) |

Примеры:

```
GET /api/leaderboard
GET /api/leaderboard?page=2
GET /api/leaderboard?page=1&pageSize=10
```

Авторизация **не требуется**.

**Ответ (`data`) — PagedLeaderboardResponse:**

```json
{
  "items": [
    {
      "position": 1,
      "userId": 2,
      "login": "player1",
      "totalStars": 15,
      "levelsPassed": 6
    },
    {
      "position": 2,
      "userId": 3,
      "login": "player2",
      "totalStars": 9,
      "levelsPassed": 4
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalPlayers": 25,
  "totalPages": 3
}
```

### Поля ответа лидерборда

| Поле            | Тип    | Описание |
|-----------------|--------|----------|
| `items`         | array  | Список игроков на текущей странице |
| `items[].position`     | int    | Место в рейтинге (сквозное: 1, 2… 11, 12…) |
| `items[].userId`       | int    | ID пользователя |
| `items[].login`        | string | Логин |
| `items[].totalStars`   | int    | Сумма звёзд за все уровни |
| `items[].levelsPassed` | int    | Количество уровней с записью в `result` |
| `page`          | int    | Текущая страница |
| `pageSize`      | int    | Размер страницы |
| `totalPlayers`  | int    | Всего игроков в рейтинге |
| `totalPages`    | int    | Всего страниц |

**Как считается рейтинг:**

1. По таблице `result` для каждого `user_id`:  
   `totalStars = SUM(total_score)`, `levelsPassed = COUNT(*)`.
2. Сортировка: звёзды ↓, затем число пройденных уровней ↓.
3. Игроки без записей в `result` в рейтинг не попадают.

**Коды:** 200, 500

---

## Технические детали

### Типы данных

| Тип C#     | Тип JSON | Описание        |
|------------|----------|-----------------|
| `int`      | number   | Целые числа     |
| `string`   | string   | Текст           |
| `bool`     | boolean  | true / false    |
| `DateTime` | string   | ISO 8601        |
| `object`   | object   | Вложенные объекты |
| `list`     | array    | Массивы         |

### Коды ответов HTTP

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 201 | Создано (регистрация / уровень) |
| 400 | Ошибка валидации |
| 401 | Не авторизован |
| 403 | Аккаунт заблокирован |
| 404 | Не найдено |
| 409 | Конфликт (логин занят) |
| 500 | Ошибка сервера |

### Примечания

1. Названия уровней и карта берутся из JSON-поля `map_data`.
2. Статусы и сложности возвращаются на русском.
3. Пароли в ответах никогда не отдаются.
4. `userStars` в уровнях: 0–3, из `result.total_score`; без токена всегда 0.
5. Лидерборд считается «на лету» из `result`, таблица `leaderboard` в БД для этого эндпоинта не используется.
6. `/api/profile` требует токен; `/api/level` и `/api/leaderboard` — открытые (токен для уровней опционален, чтобы получить свои звёзды).
