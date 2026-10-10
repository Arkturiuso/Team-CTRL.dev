namespace Server_RoboCode.Models
{
    public class ProfileResponse
    {
        public UserInfo User { get; set; } = null!;
        public UserStats Stats { get; set; } = null!;
        public int? RankPosition { get; set; }
        public List<AttemptHistoryItem> RecentAttempts { get; set; } = new();
    }
}
