# RoboCode API Documentation

## Как запустить

1. Установите [Docker Desktop](https://www.docker.com/products/docker-desktop/) и дождитесь статуса **Running**.
2. Откройте терминал в папке проекта (рядом с `docker-compose.yml`).
3. Убедитесь, что SQL-дамп лежит рядом с compose и **имя файла совпадает** с путём в `docker-compose.yml`  
   (например `./ROBOCODEDBFINAL.sql` → файл должен называться именно `ROBOCODEDBFINAL.sql`).
4. Запуск:
   ```bash
   docker compose up -d --build
   ```
5. API: http://localhost:7085/swagger  
6. MySQL с хоста: `localhost:3307`  
   (внутри Docker-сети API ходит на `robocode-mysql:3306`)

### Важно про БД

- Init-скрипт из `docker-entrypoint-initdb.d` выполняется **только при первом создании тома**.
- Если таблицы пустые: либо `docker compose down -v && docker compose up -d`, либо ручной импорт:
  ```bash
  docker exec -i robocode-mysql mysql -uroot -proot_secure_pass robocode < ROBOCODEDBFINAL.sql
  ```

### Тестовые пользователи (из дампа)

| login    | password   | role   |
|----------|------------|--------|
| admin    | admin123   | admin  |
| player1  | player123  | player |
| player2  | player456  | player |

---

## Как работает авторизация

1. **Login / Register** проверяют пользователя в БД и возвращают:
   - **accessToken** (JWT, ~1 час) — для запросов к защищённым эндпоинтам;
   - **refreshToken** — длинная строка, хранится в БД (hash), срок ~7 дней.
2. В JWT лежат claims: `userId` (`NameIdentifier`), `login`, `role`.
3. Защищённые методы помечены `[Authorize]`. Нужен заголовок:
   ```http
   Authorization: Bearer <accessToken>
   ```
4. Без префикса `Bearer ` сервер вернёт **401 Unauthorized**.

### Как авторизоваться в Swagger

1. Вызови **POST `/api/auth/login`** (например `player1` / `player123`).
2. В ответе скопируй `data.tokens.accessToken`.
3. Нажми кнопку **Authorize** (замок вверху справа).
4. В поле **Value** вставь **целиком**:
   ```text
   Bearer eyJhbGciOiJIUzI1NiIs...
   ```
   (слово `Bearer`, пробел, затем токен — **не** только JWT).
5. **Authorize** → **Close**.
6. Вызывай **GET `/api/profile`** — должен вернуться профиль.

Для Postman / curl:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Общий формат ответа (`ApiResponse`)

```json
{
  "success": true,
  "message": "Описание",
  "data": { },
  "timestamp": "2026-10-20T12:00:00Z"
}
```

---

## 1. Авторизация

### POST `/api/auth/login`

| Поле       | Тип    | Обязательное | Описание |
|------------|--------|--------------|----------|
| `login`    | string | да           | max 64 |
| `password` | string | да           | max 255 |

```json
{
  "login": "player1",
  "password": "player123"
}
```

**Ответ (`data`):**

```json
{
  "userId": 2,
  "login": "player1",
  "role": "player",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "expiresAt": "2026-10-27T12:00:00Z"
  }
}
```

`accessToken` — для заголовка `Authorization`.  
`refreshToken` — для будущего обновления access (эндпоинт refresh можно добавить отдельно).

**Коды:** 200, 400, 401, 403, 500

---

## 2. Регистрация

### POST `/api/register`

| Поле       | Тип    | Обязательное | Описание |
|------------|--------|--------------|----------|
| `login`    | string | да           | уникальный, max 64 |
| `password` | string | да           | max 255 |

Создаёт пользователя (`role: player`), записи в `player_statistics` и `leaderboard`, выдаёт access + refresh токены.

**Ответ (`data`):**

```json
{
  "userId": 5,
  "login": "new_player",
  "role": "player",
  "registration": "2026-10-20T12:00:00Z",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "expiresAt": "2026-10-27T12:00:00Z"
  }
}
```

**Коды:** 201, 400, 409, 500

---

## 3. Профиль игрока

### GET `/api/profile`

**Требует авторизации:** `Authorization: Bearer <accessToken>`.

ID пользователя берётся из JWT (`ClaimTypes.NameIdentifier`).

**Ответ (`data`):**

```json
{
  "user": {
    "login": "player1",
    "registrationDate": "2026-10-05T09:11:00",
    "accountStatusName": "Активен",
    "role": "player",
    "totalStars": 0,
    "levelsPassedCount": 0
  },
  "stats": {
    "totalScore": 0,
    "levelsPassed": 0,
    "lastUpdate": "2026-10-05T09:11:00"
  },
  "rankPosition": 1,
  "recentAttempts": []
}
```

**Коды:** 200, 401, 404, 500

---

## 4. Уровни

### GET `/api/level`

Список всех уровней. Авторизация **не обязательна**.

С заголовком `Authorization: Bearer <token>` в каждом элементе заполняется `userStars` (0–3) из таблицы `result`. Без токена — всегда `0`.

### GET `/api/level/{id}`

Один уровень. `userStars` — так же, если передан Bearer-токен.

### POST `/api/level`

Создание уровня.

| Поле            | Тип    | Обязательное | Описание |
|-----------------|--------|--------------|----------|
| `mapData`       | object | да           | Полный JSON карты |
| `difficultyId`  | int    | да           | 1=easy … 4=expert |
| `levelStatusId` | int    | нет          | 1=available (по умолч.), 2=blocked, 3=hidden |

Пример `mapData`:

```json
{
  "exit": "I9",
  "keys": [{ "id": 1, "position": "B2" }],
  "walls": [{ "id": 1, "side1": "A1-A3", "side2": "B1-B3" }],
  "width": 9,
  "height": 9,
  "entrance": "A1",
  "keys_count": 1,
  "level_name": "Название",
  "description": "Описание"
}
```

### Поля LevelResponse

| Поле | Описание |
|------|----------|
| `levelId`, `mapData`, `levelName`, `description`, `width`, `height` | Данные уровня |
| `difficultyName`, `levelStatusName` | На русском |
| `userStars` | 0–3 для текущего пользователя; 0 если нет токена или нет записи в `result` |

**Коды:** 200, 201, 400, 404, 500

---

## 5. Таблица лидеров

### GET `/api/leaderboard`

Пагинация. Авторизация не нужна.

| Query      | По умолчанию | Описание |
|------------|--------------|----------|
| `page`     | 1            | Номер страницы |
| `pageSize` | 10           | Размер (макс. 50) |

Рейтинг: `SUM(result.total_score)` (звёзды), при равенстве — больше пройденных уровней.  
Игроки без записей в `result` не попадают в список.

```json
{
  "items": [
    {
      "position": 1,
      "userId": 2,
      "login": "player1",
      "totalStars": 15,
      "levelsPassed": 6
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalPlayers": 25,
  "totalPages": 3
}
```

**Коды:** 200, 500

---

## Docker: connection string

| Где крутится API | Server | Port |
|------------------|--------|------|
| Контейнер `robocode-api` | `robocode-mysql` | `3306` |
| Visual Studio / `dotnet run` на хосте | `localhost` | `3307` |

Пример env в `docker-compose.yml`:

```yaml
- ConnectionStrings__DefaultConnection=Server=robocode-mysql;Database=robocode;User=robouser;Password=user_secure_pass;Port=3306;
```

Пароль/пользователь должны совпадать с `MYSQL_*` у сервиса БД.

---

## Коды HTTP

| Код | Значение |
|-----|----------|
| 200 | Успех |
| 201 | Создано |
| 400 | Валидация |
| 401 | Нет / неверный токен или логин |
| 403 | Аккаунт заблокирован |
| 404 | Не найдено |
| 409 | Логин занят |
| 500 | Ошибка сервера / БД |

---

## Примечания

1. Пароли в ответах API не возвращаются.
2. Статусы и сложности — на русском.
3. `userStars` и рейтинг лидерборда опираются на `result.total_score` (ожидается 0–3 за уровень).
4. В Swagger всегда: **`Bearer ` + accessToken**.
5. Имя SQL-файла в папке проекта должно совпадать с volume в `docker-compose.yml`.
