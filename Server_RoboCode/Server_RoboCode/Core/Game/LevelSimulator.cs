namespace Server_RoboCode.Core.Game;

public enum Direction
{
    Up,
    Right,
    Down,
    Left
}

/// <summary>
/// Детерминированная модель уровня-лабиринта по эталону: робот с позицией и
/// направлением, стены и камни как препятствия, ключи и выход-дверь.
/// Один вызов функции робота ровно один тик; врезался в стену - уровень не засчитывается.
/// </summary>
public sealed class LevelSimulator
{
    /// <summary>Защита от бесконечного цикла, не геймплейное ограничение.</summary>
    private const int MaxRobotCalls = 1000;

    private readonly GameMap _map;
    private readonly HashSet<Pos> _collectedKeys = new();
    private readonly HashSet<Pos> _collectedCoins = new();
    private readonly List<GameFrame> _frames = new();
    private readonly List<ConsoleEntry> _console = new();
    private int _actionGuard;
    private bool _crashed;
    private bool _errorInCode;
    private int? _errorLine;

    public Pos RobotPosition { get; private set; }
    public Direction Facing { get; private set; }
    public int Ticks { get; private set; }
    public bool Finished { get; private set; }
    public bool Success { get; private set; }
    public string? FinishMessage { get; private set; }
    public GameMap Map => _map;
    public int KeysTotal => _map.Keys.Count;
    public int KeysCollected => _collectedKeys.Count;
    public bool AllKeysCollected => _collectedKeys.Count == _map.Keys.Count;

    /// <summary>Монеты - коллекционный бонус: на Finished/Success и балл не влияют.</summary>
    public int CoinsTotal => _map.Coins.Count;
    public int CoinsCollected => _collectedCoins.Count;

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
    }

    /// <summary>
    /// Снимок состояния для StartState/EndState и /state: только чтение,
    /// игровая логика и накопленные ключи/монеты не меняются.
    /// </summary>
    public SimulatorSnapshot Snapshot() => new()
    {
        Position = RobotPosition,
        Direction = FacingName(),
        CollectedKeyCells = _collectedKeys
            .Select(position => position.Name)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList(),
        CollectedCoinCells = _collectedCoins
            .Select(position => position.Name)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList()
    };

    /// <summary>Готовит симулятор к новому запуску программы.</summary>
    public void BeginRun()
    {
        Finished = false;
        Success = false;
        FinishMessage = null;
        _crashed = false;
        _errorInCode = false;
        _errorLine = null;
        _actionGuard = 0;
        _frames.Clear();
        _console.Clear();
    }

    public void Move(int line)
    {
        EnsureNotFinished();
        GuardActions();

        var next = Step(RobotPosition, Facing);

        // Ограничение эталона: врезался в стену, камень или край поля - уровень не засчитывается.
        if (!_map.CanStep(RobotPosition, next))
        {
            _crashed = true;
            PushFrame(line, crashed: true);
            throw new RobotCrashedException("Робот врезался в стену - уровень не засчитывается", line);
        }

        RobotPosition = next;
        Ticks++;
        var keyTaken = CollectKeyAt(RobotPosition);
        var coinTaken = CollectCoinAt(RobotPosition);
        PushFrame(line, keyTaken, coinTaken: coinTaken);
    }

    public void TurnLeft(int line)
    {
        EnsureNotFinished();
        GuardActions();

        Facing = (Direction)(((int)Facing + 3) % 4);
        Ticks++;
        PushFrame(line);
    }

    public void TurnRight(int line)
    {
        EnsureNotFinished();
        GuardActions();

        Facing = (Direction)(((int)Facing + 1) % 4);
        Ticks++;
        PushFrame(line);
    }

    public void AddConsole(int line, string text)
    {
        if (_console.Count >= 400) return;
        _console.Add(new ConsoleEntry { Line = line, Text = text, Kind = "output" });
    }

    /// <summary>
    /// Ошибка программы (парсер, гейт команды, выполнение) в консоль прогона.
    /// Строка ошибки попадает и в console, и в результат через Finish(errorLine).
    /// </summary>
    public void RecordError(string message, int? line)
    {
        if (_console.Count >= 400) return;
        _console.Add(new ConsoleEntry { Line = line ?? 0, Text = message, Kind = "error" });
    }

    public SimulationResult Finish(string? programError = null, int? errorLine = null, bool crashed = false)
    {
        if (Finished) return BuildResult();

        Finished = true;
        _crashed = crashed || _crashed;
        _errorInCode = programError != null;
        _errorLine = programError != null ? errorLine : null;

        if (programError != null)
        {
            Success = false;
            FinishMessage = programError;
        }
        else if (RobotPosition != _map.Exit)
        {
            Success = false;
            FinishMessage = "Робот не дошёл до выхода - попробуйте ещё раз";
        }
        else if (!AllKeysCollected)
        {
            Success = false;
            FinishMessage = $"Дверь заперта: соберите все ключи ({KeysCollected} из {KeysTotal})";
        }
        else
        {
            Success = true;
            FinishMessage = "Выход найден!";
        }

        return BuildResult();
    }

    private SimulationResult BuildResult()
    {
        return new SimulationResult
        {
            Success = Success,
            Status = Success ? "success" : "error",
            ErrorMessage = Success ? null : FinishMessage,
            ErrorLine = Success ? null : _errorLine,
            Ticks = Ticks,
            KeysCollected = KeysCollected,
            KeysTotal = KeysTotal,
            CoinsCollected = CoinsCollected,
            CoinsTotal = CoinsTotal,
            Crashed = _crashed,
            ErrorInCode = _errorInCode,
            RobotX = RobotPosition.X,
            RobotY = RobotPosition.Y,
            RobotDirection = FacingName(),
            Frames = _frames,
            Console = _console
        };
    }

    private bool CollectKeyAt(Pos position)
    {
        return _map.KeyPositions.Contains(position) && _collectedKeys.Add(position);
    }

    private bool CollectCoinAt(Pos position)
    {
        return _map.CoinPositions.Contains(position) && _collectedCoins.Add(position);
    }

    private void GuardActions()
    {
        _actionGuard++;
        if (_actionGuard > MaxRobotCalls)
            throw new SimulationException("Похоже на бесконечный цикл: слишком много вызовов функций робота");
    }

    private void EnsureNotFinished()
    {
        if (Finished) throw new SimulationException("Выполнение уже завершено");
    }

    /// <summary>Ровно один кадр на один вызов функции робота - ровно один тик.</summary>
    private void PushFrame(int? line, bool keyTaken = false, bool crashed = false, bool coinTaken = false)
    {
        _frames.Add(new GameFrame
        {
            Tick = Ticks,
            X = RobotPosition.X,
            Y = RobotPosition.Y,
            Direction = FacingName(),
            CodeLine = line,
            KeyTaken = keyTaken,
            CoinTaken = coinTaken,
            AtExit = RobotPosition == _map.Exit,
            Crashed = crashed
        });
    }

    private string FacingName() => Facing.ToString().ToLowerInvariant();

    private static Pos Step(Pos pos, Direction direction) => direction switch
    {
        Direction.Up => new Pos(pos.X, pos.Y - 1),
        Direction.Down => new Pos(pos.X, pos.Y + 1),
        Direction.Left => new Pos(pos.X - 1, pos.Y),
        _ => new Pos(pos.X + 1, pos.Y)
    };
}
