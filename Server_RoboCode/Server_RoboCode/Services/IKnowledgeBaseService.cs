using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface IKnowledgeBaseService
    {
        Task<KnowledgeBaseResponse> GetForUserAsync(int userId);
    }
}
