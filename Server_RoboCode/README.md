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
   - **accessToken** (JWT, ~1 час) - для запросов к защищённым эндпоинтам;
   - **refreshToken** - длинная строка, хранится в БД (hash), срок ~7 дней.
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
   (слово `Bearer`, пробел, затем токен - **не** только JWT).
5. **Authorize** → **Close**.
6. Вызови **GET `/api/profile`** - должен вернуться профиль.

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
- `userAttempts` и `userBestScore` из таблицы `result`;
- `allowedCommands` - команды уровня **∪** уже открытые игроком (`knowledge_base`);
- `newCommands` - только команды, привязанные к уровню (`level_command`).

Игроку отдаются только уровни со статусом «доступен». Админ видит все статусы
(«доступен» / «заблокирован» / «скрыт») - статус авторитетен на сервере,
никаких разблокировок по звёздам.

### GET `/api/level/{id}`

Один уровень. Те же поля. Недоступный игроку уровень - `404`.

### POST `/api/level`

Создание уровня (`mapData`, `difficultyId`, `levelStatusId`).

### Поля LevelResponse (дополнительно)

| Поле | Описание |
|------|----------|
| `keysCount` | Количество ключей уровня (колонка `level.keys_count`) |
| `coinsCount` | Количество монет уровня (колонка `level.coins_count`, синхронна с `map_data.coins`) |
| `userAttempts` | Число попыток игрока на уровне |
| `userBestScore` | Лучший балл игрока на уровне (из `result.total_score`) |
| `allowedCommands` | Список команд, которыми можно проходить уровень сейчас (KB ∪ level_command) |
| `newCommands` | Команды, которые даёт именно этот уровень |

Пример элемента `allowedCommands` / `newCommands`:

```json
{
  "commandId": 1,
  "name": "move",
  "syntax": "robot.move()",
  "description": "Шаг робота вперёд по направлению взгляда"
}
```

**Коды:** 200, 201, 400, 404, 500

---

## 5. Прогон уровня (попытка)

### POST `/api/execution/run`

**Требует авторизации.**

Запуск программы игрока на уровне. Сервер исполняет код целиком, пишет попытку
в `attempt` и возвращает итог с покадровой историей.

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `levelId` | int | да | ID уровня |
| `code` | string | да | Текст программы на Python-подмножестве |
| `preview` | bool | нет | Тренировочный прогон: не писать в историю и результаты (для любой роли) |

**Ответ (`data`):**

```json
{
  "attemptId": 5959,
  "status": "success",
  "success": true,
  "ticks": 6,
  "linesCount": 2,
  "keysCollected": 1,
  "keysTotal": 1,
  "coinsCollected": 3,
  "coinsTotal": 3,
  "score": 78,
  "difficulty": "easy",
  "errorMessage": null,
  "errorLine": null,
  "finalRobot": { "cell": "G1", "direction": "right" },
  "frames": [
    {
      "tick": 1,
      "robot": { "cell": "B1", "direction": "right" },
      "codeLine": "robot.move()",
      "keyTaken": false,
      "coinTaken": true,
      "atExit": false,
      "crashed": false
    }
  ]
}
```

`status`: `in_progress` / `success` / `error` (строка пишется и в БД,
attempt_status id 1/2/3).

### Как считается балл

```
score = max(0, BASE - K_TICKS * ticks - K_LINES * linesCount)
BASE    = 100 * шкала сложности (лёгкий=1 ... эксперт=4), константа ScoreBasePerDifficulty
K_TICKS = 2   (ScorePenaltyPerTick)
K_LINES = 5   (ScorePenaltyPerLine)
```

- Балл только за успех. Врезался в стену - попытка `error`, балл 0,
  уровень не засчитывается.
- `ticks`: один вызов команды робота = ровно один тик.
- `linesCount`: только строки кода - пустые строки и комментарии не считаются
  (`Lexer.CountCodeLines`).
- Монеты на балл не влияют: `coinsCollected`/`coinsTotal` только для интерфейса.
  Дверь открывает ключ, собирать все монеты не обязательно.
- `robot.*` вне открытой базы знаний - ошибка попытки. Чистый Python
  (`for`, `def`, `print`, `len`, `range` и т.п.) не гейтится: это язык,
  а не команды робота.
- Улучшение лучшего результата (`score` строго больше прежнего) перезаписывает
  `result` и автоматически пересчитывает `player_statistics`.

### Другие ручки по попыткам

| Маршрут | Что отдаёт |
|---------|-----------|
| `GET /api/levels/{id}/certificate` | Справка о прохождении: лучший результат уровня (тики, строки, ключи, балл, дата). Без результата - 200 и `hasResult: false`, не 500 |
| `GET /api/attempts?levelId=&page=` | История попыток игрока, обязательная пагинация (pageSize 10) |
| `GET /api/admin/levels/activity` | Отчёт админа: по каждому уровню число попыток, успехов, уникальных игроков, средние тики, лучший балл |

### Логика команд (кратко)

| Таблица | Роль |
|--------|------|
| `command` | Справочник всех команд (`move`, `turn_left`, `turn_right`, `for`, `def`, `print`) |
| `level_command` | Какие команды **даёт** уровень |
| `knowledge_base` | Какие команды игрок **уже открыл** |

При загрузке уровня: `allowedCommands = level_command ∪ knowledge_base`.  
После успешного прохождения: команды уровня дописываются в `knowledge_base`.

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
      "commandId": 1,
      "name": "move",
      "syntax": "robot.move()",
      "description": "Шаг робота вперёд по направлению взгляда"
    }
  ],
  "locked": [
    {
      "commandId": 2,
      "name": "turn_left",
      "syntax": "robot.turn_left()",
      "description": "Поворот робота на 90 градусов влево"
    }
  ]
}
```

Клиенту не нужно самому сравнивать id - только отрисовать `unlocked` и `locked`.

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

Рейтинг: порядок по `player_statistics.total_score` (сумма лучших баллов).
Позиция считается при чтении сортировкой, а не назначается при регистрации.
Игроки без записей в статистике не попадают в список.

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
2. Статусы и сложности - на русском.
3. `userBestScore` и лидерборд опираются на `result.total_score` (балл по формуле, не звёзды).
4. В Swagger: всегда **`Bearer ` + accessToken**.
5. Имя SQL-файла должно совпадать с volume в `docker-compose.yml`.
6. Прогон уровня - один запрос `POST /api/execution/run`, ответ сразу с итогом и кадрами.
7. Команды уровня настраиваются в таблице `level_command`; прогресс игрока - в `knowledge_base`.
8. Страница базы знаний: `GET /api/knowledge-base` (`unlocked` / `locked`).
