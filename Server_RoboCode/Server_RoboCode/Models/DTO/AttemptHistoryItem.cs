namespace Server_RoboCode.Models.DTO;

public class AttemptHistoryItem
{
    public int LevelId { get; set; }
    public string LevelTitle { get; set; } = null!;
    public DateTime SubmittedAt { get; set; }
    public string StatusName { get; set; } = null!;
    public int TickCount { get; set; }
    public bool IsSuccess { get; set; }
    public bool IsLevelCompleted { get; set; }
}