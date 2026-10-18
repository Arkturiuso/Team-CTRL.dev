using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly RobocodeContext _context;

    public LeaderboardService(RobocodeContext context)
    {
        _context = context;
    }

    public async Task<PagedLeaderboardResponse> GetLeaderboardAsync(int page = 1, int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50; // защита от слишком больших запросов

        // Сумма звёзд и кол-во пройденных уровней по каждому пользователю
        var rankedQuery = _context.Results
            .GroupBy(r => r.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalStars = g.Sum(r => r.TotalScore),
                LevelsPassed = g.Count()
            })
            .OrderByDescending(x => x.TotalStars)
            .ThenByDescending(x => x.LevelsPassed)
            .ThenBy(x => x.UserId);

        var totalPlayers = await rankedQuery.CountAsync();
        var totalPages = totalPlayers == 0 ? 0 : (int)Math.Ceiling(totalPlayers / (double)pageSize);

        var pageData = await rankedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userIds = pageData.Select(x => x.UserId).ToList();
        var logins = await _context.AppUsers
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.Login);

        var items = pageData.Select((x, index) => new LeaderboardItem
        {
            Position = (page - 1) * pageSize + index + 1,
            UserId = x.UserId,
            Login = logins.TryGetValue(x.UserId, out var login) ? login : $"user_{x.UserId}",
            TotalStars = x.TotalStars,
            LevelsPassed = x.LevelsPassed
        }).ToList();

        return new PagedLeaderboardResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalPlayers = totalPlayers,
            TotalPages = totalPages
        };
    }
}