namespace Server_RoboCode.Models.DTO
{
    public class LeaderboardItem
    {
        public int Position { get; set; }
        public int UserId { get; set; }
        public string Login { get; set; } = null!;
        /// <summary>Суммарный балл из player_statistics - источник рейтинга по эталону.</summary>
        public int TotalScore { get; set; }
        public int LevelsPassed { get; set; }
    }
}
