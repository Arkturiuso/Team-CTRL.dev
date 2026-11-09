using System;

namespace Server_RoboCode.Models;

/// <summary>
/// Эфемерная сессия прогона уровня: последняя клетка и направление робота,
/// собранные ключи/монеты, накопленные тики и признак завершения. Хранится в
/// базе, поэтому путь переживает перезапуск API. Ключ - (игрок, уровень, preview).
/// </summary>
public partial class RunSession
{
    public long SessionId { get; set; }
    public int UserId { get; set; }
    public int LevelId { get; set; }

    /// <summary>Показ уровня админом: отдельная сессия, на игровую не влияет.</summary>
    public bool Preview { get; set; }

    public int RobotX { get; set; }
    public int RobotY { get; set; }
    public string Direction { get; set; } = "right";

    /// <summary>JSON-массив имён клеток собранных ключей, например ["E1"].</summary>
    public string? CollectedKeys { get; set; } = "[]";

    /// <summary>JSON-массив имён клеток собранных монет.</summary>
    public string? CollectedCoins { get; set; } = "[]";

    public int Ticks { get; set; }
    public bool Completed { get; set; }
    public DateTime Updated { get; set; }
}
