namespace Server_RoboCode.Models.DTO
{
    public class LeaderboardItem
    {
        public int Position { get; set; }
        public int UserId { get; set; }
        public string Login { get; set; } = null!;
        public int TotalStars { get; set; }
        public int LevelsPassed { get; set; }
    }
}
