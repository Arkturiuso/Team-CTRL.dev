using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services
{
    public interface IAttemptService
    {
        Task<SubmitAttemptResponse> SubmitAsync(int userId, SubmitAttemptRequest request);
    }
}
