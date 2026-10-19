using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface ILeaderboardService
    {
        Task<PagedLeaderboardResponse> GetLeaderboardAsync(int page = 1, int pageSize = 10);
    }
}
