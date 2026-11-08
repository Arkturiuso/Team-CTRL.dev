namespace Server_RoboCode.Models.DTO;

public class RunCodeRequest
{
    public int LevelId { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool Preview { get; set; }
}

/// <summary>Кадр прогона: одна позиция робота на один тик.</summary>
public class FrameRobotDto
{
    public string Cell { get; set; } = "A1";
    public string Direction { get; set; } = "right";
}

public class GameFrameDto
{
    public int Tick { get; set; }
    public FrameRobotDto Robot { get; set; } = new();
    public int? CodeLine { get; set; }
    public bool KeyTaken { get; set; }
    public bool CoinTaken { get; set; }
    public bool AtExit { get; set; }
    public bool Crashed { get; set; }
}

/// <summary>Одна строка вывода print() или ошибка - для консоли в ответе.</summary>
public class RunConsoleEntryDto
{
    public int Line { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Kind { get; set; } = "output";
}

/// <summary>
/// Ответ POST /api/execution/run по контракту раунда. Из ответа удалены
/// враги, босс, HP, звёзды, хазарды, ракеты, биом, terrain и session-поля.
/// Монеты - коллекционные предметы: приходят счётчиками, на балл не влияют.
/// </summary>
public class RunResultDto
{
    public int? AttemptId { get; set; }
    public string Status { get; set; } = "error";
    public bool Success { get; set; }
    public int Ticks { get; set; }
    public int LinesCount { get; set; }
    public int KeysCollected { get; set; }
    public int KeysTotal { get; set; }
    public int CoinsCollected { get; set; }
    public int CoinsTotal { get; set; }
    public int Score { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public int? ErrorLine { get; set; }
    public FrameRobotDto FinalRobot { get; set; } = new();
    public List<GameFrameDto> Frames { get; set; } = new();
    public List<RunConsoleEntryDto> Console { get; set; } = new();
}
