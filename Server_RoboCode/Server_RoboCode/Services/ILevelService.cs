using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface ILevelService
    {
        Task<List<LevelResponse>> GetAllLevelsAsync(int? userId = null, bool isAdmin = false);
        Task<LevelResponse?> GetLevelByIdAsync(int levelId, int? userId = null, bool isAdmin = false);
        Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request);
    }
}
