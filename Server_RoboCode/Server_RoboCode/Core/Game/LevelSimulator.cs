namespace Server_RoboCode.Core.Game;

public enum Direction
{
    Up,
    Right,
    Down,
    Left
}

/// <summary>
/// Детерминированная модель игрового мира: робот, стены, лёд, монеты, ключи и враги.
/// Все действия робота попадают в кадры, которые фронтенд проигрывает как анимацию.
/// </summary>
public sealed class LevelSimulator
{
    private const int MaxActions = 500;
    private const int MaxFrames = 480;

    private readonly GameMap _map;
    private readonly HashSet<int> _collectedCoins = new();
    private readonly HashSet<Pos> _collectedKeys = new();
    private readonly List<EnemyState> _enemies = new();
    private readonly List<GameFrame> _frames = new();
    private readonly List<ConsoleEntry> _console = new();
    private int _actionGuard;

    public Pos RobotPosition { get; private set; }
    public Direction Facing { get; private set; }
    public int Ticks { get; private set; }
    public bool Finished { get; private set; }
    public bool Success { get; private set; }
    public string? FinishMessage { get; private set; }
    public GameMap Map => _map;

    public LevelSimulator(GameMap map)
    {
        _map = map;
        RobotPosition = map.Entrance;
        Facing = map.EntranceDirection switch
        {
            "up" => Direction.Up,
            "down" => Direction.Down,
            "left" => Direction.Left,
            _ => Direction.Right
        };

        foreach (var def in map.Enemies)
            _enemies.Add(new EnemyState(def));
    }

    public bool HasKey => _map.RequiredKeyPosition is null || _collectedKeys.Contains(_map.RequiredKeyPosition.Value);

    public IReadOnlyCollection<int> CollectedCoins => _collectedCoins;

    public IEnumerable<string> CollectedKeyNames => _collectedKeys.Select(key => key.Name);

    public IReadOnlyList<EnemySnapshot> Enemies => _enemies.Select(enemy => new EnemySnapshot
    {
        Id = enemy.Definition.Id,
        Type = enemy.Definition.Type,
        X = enemy.Position.X,
        Y = enemy.Position.Y,
        Alive = enemy.Alive
    }).ToList();

    public string FacingName() => Facing.ToString().ToLowerInvariant();

    /// <summary>Начинает новый запуск, сохраняя состояние робота и мира между запусками.</summary>
    public void BeginRun()
    {
        Finished = false;
        Success = false;
        FinishMessage = null;
        _actionGuard = 0;
        _frames.Clear();
        _console.Clear();

        var atEntrance = RobotPosition == _map.Entrance;
        PushFrame("start", atEntrance ? "Робот на старте" : "Робот продолжает путь", null, new List<int>(), new List<string>());
    }

    public void Move(int line)
    {
        EnsureNotFinished();
        GuardActions();

        var next = Step(RobotPosition, Facing);
        if (!_map.CanStep(RobotPosition, next))
            throw new SimulationException("Стена или препятствие впереди - робот не может пройти");

        var collectedCoins = new List<int>();
        var collectedKeys = new List<string>();
        RobotPosition = next;
        Ticks++;
        if (_map.TerrainAt(RobotPosition) == "mud") Ticks++;

        CollectAt(RobotPosition, collectedCoins, collectedKeys);
        PushFrame("move", null, line, collectedCoins, collectedKeys);

        SlideOnIce(line, collectedCoins, collectedKeys);
        AfterRobotAction(line);
    }

    public void TurnLeft(int line)
    {
        EnsureNotFinished();
        GuardActions();

        Facing = (Direction)(((int)Facing + 3) % 4);
        Ticks++;
        PushFrame("turn", null, line, new List<int>(), new List<string>());
        AfterRobotAction(line);
    }

    public void TurnRight(int line)
    {
        EnsureNotFinished();
        GuardActions();

        Facing = (Direction)(((int)Facing + 1) % 4);
        Ticks++;
        PushFrame("turn", null, line, new List<int>(), new List<string>());
        AfterRobotAction(line);
    }

    public void Attack(int line)
    {
        EnsureNotFinished();
        GuardActions();

        var target = Step(RobotPosition, Facing);
        var enemy = _enemies.FirstOrDefault(e => e.Alive && e.Position == target);
        if (enemy == null)
            throw new SimulationException("Перед роботом нет врага - атака не удалась");

        enemy.Alive = false;
        Ticks++;
        PushFrame("attack", "Враг повержен", line, new List<int>(), new List<string>());
        AfterRobotAction(line);
    }

    public void AddConsole(int line, string text)
    {
        if (_console.Count >= 400) return;
        _console.Add(new ConsoleEntry { Line = line, Text = text, Kind = "output" });
    }

    public void RecordCompileError(string message, int? line)
    {
        _console.Add(new ConsoleEntry { Line = line ?? 0, Text = message, Kind = "error" });
    }

    public SimulationResult Finish(string? programError = null, int? errorLine = null, bool destroyed = false)
    {
        if (Finished) return BuildResult();

        Finished = true;

        if (programError != null)
        {
            Success = false;
            FinishMessage = programError;
            PushFrame("error", programError, errorLine, new List<int>(), new List<string>());
        }
        else if (destroyed)
        {
            Success = false;
            FinishMessage = "Робот столкнулся с врагом - попробуйте другой маршрут";
            PushFrame("dead", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else if (RobotPosition != _map.Exit)
        {
            Success = false;
            FinishMessage = "Робот не дошёл до выхода - попробуйте ещё раз";
            PushFrame("error", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else if (!HasKey)
        {
            Success = false;
            FinishMessage = "Дверь заперта! Сначала соберите обязательный ключ";
            PushFrame("locked", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else
        {
            Success = true;
            FinishMessage = "Выход найден!";
            PushFrame("success", FinishMessage, errorLine, new List<int>(), new List<string>());
        }

        return BuildResult();
    }

    private SimulationResult BuildResult()
    {
        var allCoins = _collectedCoins.Count == _map.Coins.Count;
        var stars = Success ? 1 : 0;
        if (Success && allCoins) stars++;

        return new SimulationResult
        {
            Success = Success,
            Status = Success ? "success" : "error",
            ErrorMessage = Success ? null : FinishMessage,
            Ticks = Ticks,
            HasKey = HasKey,
            AtExit = RobotPosition == _map.Exit,
            Stars = stars,
            CollectedCoins = _collectedCoins.Count,
            TotalCoins = _map.Coins.Count,
            Frames = _frames,
            Console = _console
        };
    }

    private void SlideOnIce(int line, List<int> collectedCoins, List<string> collectedKeys)
    {
        var slides = 0;
        while (_map.TerrainAt(RobotPosition) == "ice" && slides < 3)
        {
            var next = Step(RobotPosition, Facing);
            if (!_map.CanStep(RobotPosition, next)) break;

            RobotPosition = next;
            Ticks++;
            slides++;
            CollectAt(RobotPosition, collectedCoins, collectedKeys);
            PushFrame("slide", "Скольжение по льду", line, collectedCoins, collectedKeys);
        }
    }

    private void CollectAt(Pos position, List<int> collectedCoins, List<string> collectedKeys)
    {
        foreach (var coin in _map.Coins)
        {
            if (coin.Position != position || !_collectedCoins.Add(coin.Id)) continue;
            collectedCoins.Add(coin.Id);
        }

        if (_map.Keys.Contains(position) && _collectedKeys.Add(position))
            collectedKeys.Add(position.Name);
    }

    private void AfterRobotAction(int line)
    {
        CheckEnemyContact(line);

        foreach (var enemy in _enemies)
        {
            if (!enemy.Alive) continue;
            enemy.Counter++;
            if (enemy.Counter % enemy.Definition.MoveEvery != 0) continue;
            enemy.MoveNext();
        }

        CheckEnemyContact(line);
    }

    private void CheckEnemyContact(int line)
    {
        var contact = _enemies.FirstOrDefault(e => e.Alive && e.Position == RobotPosition);
        if (contact == null) return;

        PushFrame("hit", "Робот столкнулся с врагом", line, new List<int>(), new List<string>());
        throw new RobotDestroyedException("Робот столкнулся с врагом - попробуйте другой маршрут");
    }

    private void GuardActions()
    {
        _actionGuard++;
        if (_actionGuard > MaxActions)
            throw new SimulationException($"Слишком много действий (лимит {MaxActions}). Проверьте циклы");
    }

    private void EnsureNotFinished()
    {
        if (Finished) throw new SimulationException("Выполнение уже завершено");
    }

    private void PushFrame(string type, string? message, int? line, List<int> collectedCoins, List<string> collectedKeys)
    {
        if (_frames.Count >= MaxFrames) return;

        _frames.Add(new GameFrame
        {
            Tick = Ticks,
            Type = type,
            X = RobotPosition.X,
            Y = RobotPosition.Y,
            Direction = FacingName(),
            HasKey = HasKey,
            AtExit = RobotPosition == _map.Exit,
            CollectedCoins = new List<int>(collectedCoins),
            CollectedKeys = new List<string>(collectedKeys),
            Enemies = _enemies.Select(e => new EnemySnapshot
            {
                Id = e.Definition.Id,
                Type = e.Definition.Type,
                X = e.Position.X,
                Y = e.Position.Y,
                Alive = e.Alive
            }).ToList(),
            Message = message,
            Line = line
        });
    }

    private static Pos Step(Pos pos, Direction direction) => direction switch
    {
        Direction.Up => new Pos(pos.X, pos.Y - 1),
        Direction.Down => new Pos(pos.X, pos.Y + 1),
        Direction.Left => new Pos(pos.X - 1, pos.Y),
        _ => new Pos(pos.X + 1, pos.Y)
    };

    private sealed class EnemyState
    {
        public EnemyDef Definition { get; }
        public Pos Position { get; private set; }
        public bool Alive { get; set; } = true;
        public int Counter { get; set; }
        private int _index;

        public EnemyState(EnemyDef definition)
        {
            Definition = definition;
            Position = definition.Patrol[0];
        }

        public void MoveNext()
        {
            if (Definition.Patrol.Count <= 1) return;
            _index = (_index + 1) % Definition.Patrol.Count;
            Position = Definition.Patrol[_index];
        }
    }
}
