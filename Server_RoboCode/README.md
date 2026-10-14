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

| Поле       | Тип    | Обязательное | Ограничения     | Описание        |
|------------|--------|--------------|-----------------|-----------------|
| `login`    | string | да           | max 64 символа  | Логин           |
| `password` | string | да           | max 255 символов| Пароль          |

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

| Поле       | Тип    | Обязательное | Ограничения              | Описание              |
|------------|--------|--------------|--------------------------|-----------------------|
| `login`    | string | да           | max 64, уникальный       | Логин                 |
| `password` | string | да           | max 255 символов         | Пароль                |

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

| Источник               | Обязательное | Описание                                      |
|------------------------|--------------|-----------------------------------------------|
| Header `Authorization` | да           | `Bearer <token>`                              |
| Body / Query / Path    | нет          | Параметров нет. ID берётся из токена          |

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

**Входные данные:** нет  
Авторизация не требуется.

**Ответ (`data`) — массив LevelResponse:**

```json
[
  {
    "levelId": 1,
    "mapData": { "...полный JSON карты..." },
    "levelName": "Лабиринт забытого храма",
    "description": "Древний храм с запутанными коридорами",
    "width": 9,
    "height": 9,
    "difficultyId": 2,
    "difficultyName": "Средний",
    "levelStatusId": 1,
    "levelStatusName": "Доступен",
    "created": "2026-10-05T09:11:00"
  }
]
```

**Коды:** 200, 500

---

### GET `/api/level/{id}`

**Входные данные (Path):**

| Параметр | Тип | Обязательное | Описание     |
|----------|-----|--------------|--------------|
| `id`     | int | да           | ID уровня    |

Пример: `GET /api/level/1`

**Ответ (`data`)** — один объект LevelResponse (как элемент массива выше).

Если не найден — 404:

```json
{
  "success": false,
  "message": "Уровень с ID 999 не найден",
  "data": null
}
```

**Коды:** 200, 404, 500

---

## Технические детали

### Типы данных

| Тип C#     | Тип JSON  | Описание                          |
|------------|-----------|-----------------------------------|
| `int`      | number    | Целые числа                       |
| `string`   | string    | Текст                             |
| `bool`     | boolean   | true / false                      |
| `DateTime` | string    | ISO 8601                          |
| `object`   | object    | Вложенные объекты                 |
| `list`     | array     | Массивы                           |

### Коды ответов HTTP

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 201 | Создано (регистрация) |
| 400 | Ошибка валидации |
| 401 | Не авторизован |
| 403 | Аккаунт заблокирован |
| 404 | Не найдено |
| 409 | Конфликт (логин занят) |
| 500 | Ошибка сервера |

### Примечания

1. Названия уровней и карта берутся из JSON-поля `map_data`.
2. Статусы возвращаются на русском.
3. Пароли в ответах никогда не отдаются.
4. `/api/profile` требует токен, `/api/level` — открытый.
