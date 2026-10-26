using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server_RoboCode.Services;

public class UserService : IUserService
{
    private readonly RobocodeContext _context;

    public UserService(RobocodeContext context)
    {
        _context = context;
    }

    public async Task<List<AdminUserDto>> GetAllUsersAsync()
    {
        return await _context.AppUsers
            .Include(u => u.AccountStatus)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                Login = u.Login,
                Role = u.Role,
                AccountStatusId = u.AccountStatusId,
                AccountStatusName = u.AccountStatus.Name,
                Registration = u.Registration
            })
            .OrderByDescending(u => u.Registration)
            .ToListAsync();
    }

    public async Task<bool> UpdateUserStatusAsync(int userId, int accountStatusId)
    {
        var user = await _context.AppUsers.FindAsync(userId);
        if (user == null) return false;

        user.AccountStatusId = accountStatusId;
        await _context.SaveChangesAsync();
        return true;
    }
}