namespace Server_RoboCode.Core.Game;

public sealed class EnemySnapshot
{
    public int Id { get; init; }
    public string Type { get; init; } = "slime";
    public int X { get; init; }
    public int Y { get; init; }
    public bool Alive { get; init; } = true;
}

public sealed class GameFrame
{
    public int Tick { get; set; }
    public string Type { get; set; } = "move";
    public int X { get; set; }
    public int Y { get; set; }
    public string Direction { get; set; } = "right";
    public bool HasKey { get; set; }
    public bool AtExit { get; set; }
    public List<int> CollectedCoins { get; set; } = new();
    public List<string> CollectedKeys { get; set; } = new();
    public List<EnemySnapshot> Enemies { get; set; } = new();
    public string? Message { get; set; }
    public int? Line { get; set; }
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
    public bool HasKey { get; set; }
    public bool AtExit { get; set; }
    public int Stars { get; set; }
    public int CollectedCoins { get; set; }
    public int TotalCoins { get; set; }
    public List<GameFrame> Frames { get; set; } = new();
    public List<ConsoleEntry> Console { get; set; } = new();
}

public sealed class SimulationException : Exception
{
    public SimulationException(string message) : base(message) { }
}

public sealed class RobotDestroyedException : Exception
{
    public RobotDestroyedException(string message) : base(message) { }
}
