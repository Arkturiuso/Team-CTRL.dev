using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface ILevelService
    {
        Task<List<LevelResponse>> GetAllLevelsAsync();
        Task<LevelResponse?> GetLevelByIdAsync(int levelId);
        Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request);
    }
}
