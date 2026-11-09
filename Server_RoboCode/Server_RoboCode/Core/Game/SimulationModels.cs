namespace Server_RoboCode.Core.Game;

/// <summary>
/// Кадр прогона для анимации 2D-плиток: позиция робота на тике и что случилось.
/// Кадр создаётся ровно на один вызов функции робота (один вызов = один тик).
/// </summary>
public sealed class GameFrame
{
    public int Tick { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
    public string Direction { get; set; } = "right";
    public int? CodeLine { get; set; }
    public bool KeyTaken { get; set; }
    public bool CoinTaken { get; set; }
    public bool AtExit { get; set; }
    public bool Crashed { get; set; }
}

/// <summary>
/// Read-only снимок состояния робота между запусками: позиция, направление и
/// клетки уже собранных ключей/монет. Игровую логику не меняет.
/// </summary>
public sealed class SimulatorSnapshot
{
    public Pos Position { get; init; }
    public string Direction { get; init; } = "right";
    public List<string> CollectedKeyCells { get; init; } = new();
    public List<string> CollectedCoinCells { get; init; } = new();
}

public sealed class ConsoleEntry
{
    public int Line { get; init; }
    public string Text { get; init; } = string.Empty;
    public string Kind { get; init; } = "output";
}

public sealed class SimulationResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = "error";
    public string? ErrorMessage { get; set; }
    public int? ErrorLine { get; set; }
    public int Ticks { get; set; }
    public int KeysCollected { get; set; }
    public int KeysTotal { get; set; }
    public int CoinsCollected { get; set; }
    public int CoinsTotal { get; set; }
    public bool Crashed { get; set; }
    public bool ErrorInCode { get; set; }
    public int RobotX { get; set; }
    public int RobotY { get; set; }
    public string RobotDirection { get; set; } = "right";
    public List<GameFrame> Frames { get; set; } = new();
    public List<ConsoleEntry> Console { get; set; } = new();
}

public sealed class SimulationException : Exception
{
    public SimulationException(string message) : base(message) { }
}

/// <summary>
/// Робот врезался в стену, камень или край поля: уровень не засчитывается
/// (ограничение эталона), попытка получает статус "ошибка".
/// </summary>
public sealed class RobotCrashedException : Exception
{
    public int? Line { get; }

    public RobotCrashedException(string message, int? line = null) : base(message) => Line = line;
}
