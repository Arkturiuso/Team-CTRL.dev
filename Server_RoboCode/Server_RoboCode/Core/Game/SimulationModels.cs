namespace Server_RoboCode.Core.Game;

public sealed class EnemySnapshot
{
    public int Id { get; init; }
    public string Type { get; init; } = "slime";
    public int X { get; init; }
    public int Y { get; init; }
    public bool Alive { get; init; } = true;
    public int Hp { get; init; } = 1;
    public int MaxHp { get; init; } = 1;
    public bool Boss { get; init; }
    public bool HasKey { get; init; }
    public bool Shielded { get; init; }
}

public sealed class HazardSnapshot
{
    public int Id { get; init; }
    public string Kind { get; init; } = "tree";
    public List<string> Cells { get; init; } = new();
    public string State { get; init; } = "warn";
    public int Fuse { get; init; }
    public int Damage { get; init; }
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
    public string? KeyPosition { get; set; }
    public List<string> FakeKeys { get; set; } = new();
    public string? BossAim { get; set; }
    public string? BossMark { get; set; }
    public List<HazardSnapshot> Hazards { get; set; } = new();
    public string? BossFrom { get; set; }
    public string? BossTo { get; set; }
    public string Exit { get; set; } = "A1";
    public int PlayerHp { get; set; }
    public int PlayerMaxHp { get; set; }
    public int AttackCooldown { get; set; }
    public bool BossDefeated { get; set; }
    public string? Message { get; set; }
    public string? Speaker { get; set; }
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
    public bool Crashed { get; set; }
    public bool ErrorInCode { get; set; }
    public bool BossDefeated { get; set; }
    public bool Defeated { get; set; }
    public int PlayerHp { get; set; }
    public int PlayerMaxHp { get; set; }
    public int AttackCooldown { get; set; }
    public int KeysCollected { get; set; }
    public int KeysTotal { get; set; }
    public int FakeKeyHits { get; set; }
    public string Exit { get; set; } = "A1";
    public string? BossName { get; set; }
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

/// <summary>Игрок потерял все жизни на уровне с боссом - уровень начинается с нуля.</summary>
public sealed class PlayerDefeatedException : Exception
{
    public PlayerDefeatedException() : base("Игрок потерял все жизни") { }
}

/// <summary>Робот врезался в стену, дерево или край карты - уровень начинается заново.</summary>
public sealed class RobotCrashedException : Exception
{
    public RobotCrashedException(string message) : base(message) { }
}
