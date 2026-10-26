using System.Collections.Generic;
using System.Threading.Tasks;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

public interface IUserService
{
    Task<List<AdminUserDto>> GetAllUsersAsync();
    Task<bool> UpdateUserStatusAsync(int userId, int accountStatusId);
}