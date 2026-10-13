using Server_RoboCode.Models;
using Server_RoboCode.Services;
using System.Threading.Tasks;

namespace Server_RoboCode.Services;

public interface IProfileService
{
    Task<ProfileResponse?> GetProfileAsync(int userId);
}