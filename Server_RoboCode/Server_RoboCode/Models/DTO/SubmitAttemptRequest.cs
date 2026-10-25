namespace Server_RoboCode.Models.DTO
{
    public class SubmitAttemptRequest
    {
        public int LevelId { get; set; }

        public List<string>? Commands { get; set; }

        public string? SourceCode { get; set; }

        public int TickCount { get; set; }

        public int TotalScore { get; set; }

        public string Status { get; set; } = "success";

        public string? ErrorMessage { get; set; }
    }
}
