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
6. Вызови **GET `/api/profile`** — должен вернуться профиль.

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

**Коды:** 200, 400, 401, 403, 500

---

## 2. Регистрация

### POST `/api/register`

| Поле       | Тип    | Обязательное | Описание |
|------------|--------|--------------|----------|
| `login`    | string | да           | уникальный, max 64 |
| `password` | string | да           | max 255 |

Создаёт пользователя (`role: player`), записи в `player_statistics` и `leaderboard`, выдаёт access + refresh токены.

**Коды:** 201, 400, 409, 500

---

## 3. Профиль игрока

### GET `/api/profile`

**Требует авторизации:** `Authorization: Bearer <accessToken>`.

ID пользователя берётся из JWT.

**Коды:** 200, 401, 404, 500

---

## 4. Уровни

### GET `/api/level`

Список всех уровней. Авторизация **не обязательна**.

С заголовком `Authorization: Bearer <token>`:
- `userStars` (0–3) из таблицы `result`;
- `allowedCommands` — команды уровня **∪** уже открытые игроком (`knowledge_base`);
- `newCommands` — только команды, привязанные к уровню (`level_command`).

Без токена: `userStars = 0`, в командах только то, что есть у уровня (KB пустой).

### GET `/api/level/{id}`

Один уровень. Те же поля `userStars`, `allowedCommands`, `newCommands`.

### POST `/api/level`

Создание уровня (`mapData`, `difficultyId`, `levelStatusId`).

### Поля LevelResponse (дополнительно)

| Поле | Описание |
|------|----------|
| `userStars` | 0–3; из `result.total_score` |
| `allowedCommands` | Список команд, которыми можно проходить уровень сейчас (KB ∪ level_command) |
| `newCommands` | Команды, которые даёт именно этот уровень |

Пример элемента `allowedCommands` / `newCommands`:

```json
{
  "commandId": 4,
  "name": "move_right",
  "syntax": "move_right()",
  "description": "Движение робота на одну клетку вправо по карте"
}
```

**Коды:** 200, 201, 400, 404, 500

---

## 5. Результат прохождения уровня (попытка)

### POST `/api/attempt`

**Требует авторизации.**

Отправка **итога** прохождения (тики и команды — один раз в конце, не стримом).

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `levelId` | int | да | ID уровня |
| `commands` | string[] | нет* | Список команд (склеивается в `source_code`) |
| `sourceCode` | string | нет* | Готовый текст программы |
| `tickCount` | int | да | Число тиков симуляции |
| `totalScore` | int | да | Звёзды **0–3** (при success) |
| `status` | string | да | `success` / `error` / `in_progress` |
| `errorMessage` | string | нет | Текст ошибки при `error` |

\* Нужен хотя бы один из: `commands` или `sourceCode`.

**Пример (вариант с массивом команд):**

```json
{
  "levelId": 1,
  "commands": [
    "move_right()",
    "move_down()",
    "move_right()"
  ],
  "tickCount": 42,
  "totalScore": 3,
  "status": "success"
}
```

**Что делает сервер**

1. Пишет строку в `attempt` (код, тики, статус, user_id, level_id).
2. При **`success`**:
   - upsert в `result` (`tick_count`, `total_score` 0–3, `attempt_id`);
   - лучшие звёзды сохраняются (не ухудшаются);
   - команды из `level_command` этого уровня добавляются в `knowledge_base` (без дублей);
   - обновляется `player_statistics` (число пройденных / сумма звёзд).
3. При **`error`** — только `attempt`, без `result` и без новых команд в KB.

**Ответ (`data`):**

```json
{
  "attemptId": 131,
  "levelId": 1,
  "status": "success",
  "tickCount": 42,
  "userStars": 3,
  "unlockedCommands": [
    {
      "commandId": 4,
      "name": "move_right",
      "syntax": "move_right()",
      "description": "..."
    }
  ]
}
```

`unlockedCommands` — команды, **впервые** открытые этой попыткой (попали в `knowledge_base`).

**Коды:** 200, 400, 401, 500

### Логика команд (кратко)

| Таблица | Роль |
|--------|------|
| `command` | Справочник всех команд |
| `level_command` | Какие команды **даёт** уровень |
| `knowledge_base` | Какие команды игрок **уже открыл** |

При загрузке уровня: `allowedCommands = level_command ∪ knowledge_base`.  
После успешного прохождения: команды уровня дописываются в `knowledge_base`.

Тики **не** шлются во время игры — только в `POST /api/attempt` вместе с итогом.

---

## 6. База знаний (команды)

### GET `/api/knowledge-base`

**Требует авторизации:** `Authorization: Bearer <accessToken>`.

Для страницы базы знаний. API **сам** сравнивает таблицы и отдаёт один ответ с двумя списками.

| Источник | Смысл |
|----------|--------|
| `command` | Все команды в игре |
| `knowledge_base` | Уже открытые текущим пользователем |

**Логика на сервере**

1. Берёт `userId` из JWT.
2. Читает все команды из таблицы `command`.
3. Читает `command_id` из `knowledge_base` для этого пользователя.
4. Команда есть в KB → **unlocked**, нет → **locked**.

**Ответ (`data`):**

```json
{
  "unlocked": [
    {
      "commandId": 4,
      "name": "move_right",
      "syntax": "move_right()",
      "description": "Движение робота на одну клетку вправо по карте"
    }
  ],
  "locked": [
    {
      "commandId": 1,
      "name": "move_up",
      "syntax": "move_up()",
      "description": "Движение робота на одну клетку вверх по карте"
    }
  ]
}
```

Клиенту не нужно самому сравнивать id — только отрисовать `unlocked` и `locked`.

**Отличие от команд в уровне**

| Ручка | Назначение |
|-------|------------|
| `GET /api/level/{id}` | Команды **для прохождения этого уровня** (`allowedCommands` / `newCommands`) |
| `GET /api/knowledge-base` | Вся база знаний: что открыто / что ещё закрыто |

Команды попадают в `unlocked` после успешного `POST /api/attempt` (команды из `level_command` уровня записываются в `knowledge_base`).

**Коды:** 200, 401, 500

---

## 7. Таблица лидеров

### GET `/api/leaderboard`

Пагинация. Авторизация не нужна.

| Query | По умолчанию | Описание |
|-------|--------------|----------|
| `page` | 1 | Номер страницы |
| `pageSize` | 10 | Размер (макс. 50) |

Рейтинг: `SUM(result.total_score)` (сумма звёзд).  
Игроки без записей в `result` не попадают в список.

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

---

## Коды HTTP

| Код | Значение |
|-----|----------|
| 200 | Успех |
| 201 | Создано |
| 400 | Валидация |
| 401 | Нет / неверный токен |
| 403 | Аккаунт заблокирован |
| 404 | Не найдено |
| 409 | Логин занят |
| 500 | Ошибка сервера / БД |

---

## Примечания

1. Пароли в ответах API не возвращаются.
2. Статусы и сложности — на русском.
3. `userStars` и лидерборд опираются на `result.total_score` (0–3 за уровень).
4. В Swagger: всегда **`Bearer ` + accessToken**.
5. Имя SQL-файла должно совпадать с volume в `docker-compose.yml`.
6. Тики и решение уровня отправляются **один раз в конце** через `POST /api/attempt`.
7. Команды уровня настраиваются в таблице `level_command`; прогресс игрока — в `knowledge_base`.
8. Страница базы знаний: `GET /api/knowledge-base` (`unlocked` / `locked`).
