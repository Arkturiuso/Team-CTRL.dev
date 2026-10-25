namespace Server_RoboCode.Models.DTO
{
    public class SubmitAttemptResponse
    {
        public int AttemptId { get; set; }
        public int LevelId { get; set; }
        public string Status { get; set; } = null!;
        public int TickCount { get; set; }
        public int UserStars { get; set; }
        public List<CommandDto> UnlockedCommands { get; set; } = new();
    }
}
