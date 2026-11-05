namespace Server_RoboCode.Models.DTO;

public class RunCodeRequest
{
    public int LevelId { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool Preview { get; set; }
}

public class EnemyFrameDto
{
    public int Id { get; set; }
    public string Type { get; set; } = "slime";
    public int X { get; set; }
    public int Y { get; set; }
    public bool Alive { get; set; }
    public int Hp { get; set; } = 1;
    public int MaxHp { get; set; } = 1;
    public bool Boss { get; set; }
    public bool HasKey { get; set; }
    public bool Shielded { get; set; }
}

public class HazardFrameDto
{
    public int Id { get; set; }
    public string Kind { get; set; } = "tree";
    public List<string> Cells { get; set; } = new();
    public string State { get; set; } = "warn";
    public int Fuse { get; set; }
    public int Damage { get; set; }
}

public class GameFrameDto
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
    public List<EnemyFrameDto> Enemies { get; set; } = new();
    public string? KeyPosition { get; set; }
    public List<string> FakeKeys { get; set; } = new();
    public string? BossAim { get; set; }
    public string? BossMark { get; set; }
    public List<HazardFrameDto> Hazards { get; set; } = new();
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

public class ConsoleLineDto
{
    public int Line { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Kind { get; set; } = "output";
}

public class ExecutionResultDto
{
    public int LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Biome { get; set; } = "forest";
    public string? Hint { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string Entrance { get; set; } = "A1";
    public string Exit { get; set; } = "A1";

    public bool Success { get; set; }
    public string Status { get; set; } = "error";
    public string? ErrorMessage { get; set; }
    public int? ErrorLine { get; set; }
    public int Stars { get; set; }
    public int Ticks { get; set; }
    public bool HasKey { get; set; }
    public bool AtExit { get; set; }
    public int CollectedCoins { get; set; }
    public int TotalCoins { get; set; }
    public int ThreeStarRuns { get; set; }
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
    public string? BossName { get; set; }

    public List<GameFrameDto> Frames { get; set; } = new();
    public List<ConsoleLineDto> Console { get; set; } = new();
}

public class SessionStateDto
{
    public int LevelId { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
    public string Direction { get; set; } = "right";
    public bool HasKey { get; set; }
    public bool AtExit { get; set; }
    public int Ticks { get; set; }
    public List<int> CollectedCoins { get; set; } = new();
    public List<string> CollectedKeys { get; set; } = new();
    public List<EnemyFrameDto> Enemies { get; set; } = new();
    public string? KeyPosition { get; set; }
    public List<string> FakeKeys { get; set; } = new();
    public string? BossHint { get; set; }
    public string? BossAim { get; set; }
    public string? BossMark { get; set; }
    public bool BossCharging { get; set; }
    public List<HazardFrameDto> Hazards { get; set; } = new();
    public string? BossTarget { get; set; }
    public bool BossRaging { get; set; }
    public string Exit { get; set; } = "A1";
    public bool BossDefeated { get; set; }
    public int PlayerHp { get; set; }
    public int PlayerMaxHp { get; set; }
    public int AttackCooldown { get; set; }
    public int KeysCollected { get; set; }
    public int KeysTotal { get; set; }
    public int TotalCoins { get; set; }
    public bool Completed { get; set; }
    public int AttemptNumber { get; set; }
}

public class RunResponseDto
{
    public ExecutionResultDto Execution { get; set; } = new();
    public SessionStateDto State { get; set; } = new();
    public int UserStars { get; set; }
    public int AttemptNumber { get; set; }
    public List<CommandDto> UnlockedCommands { get; set; } = new();
}
