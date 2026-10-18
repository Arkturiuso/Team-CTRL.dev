using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface ILevelService
    {
        Task<List<LevelResponse>> GetAllLevelsAsync(int? userId = null);
        Task<LevelResponse?> GetLevelByIdAsync(int levelId, int? userId = null);
        Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request);
    }
}
