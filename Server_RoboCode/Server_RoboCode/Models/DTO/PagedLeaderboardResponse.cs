namespace Server_RoboCode.Models.DTO
{
    public class PagedLeaderboardResponse
    {
        public List<LeaderboardItem> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPlayers { get; set; }
        public int TotalPages { get; set; }
    }
}
