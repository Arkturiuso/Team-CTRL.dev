using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

/// <summary>
/// Таблица лидеров эталона: позиция считается упорядочиванием по сумме баллов
/// из player_statistics, а не из result и не MAX+1 при регистрации.
/// </summary>
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

        var rankedQuery = _context.PlayerStatistics
            .AsNoTracking()
            .OrderByDescending(s => s.TotalScore)
            .ThenByDescending(s => s.LevelsPassed)
            .ThenBy(s => s.UserId);

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
            // Позиция = общий ранг по сумме баллов, считается на чтении.
            Position = (page - 1) * pageSize + index + 1,
            UserId = x.UserId,
            Login = logins.TryGetValue(x.UserId, out var login) ? login : $"user_{x.UserId}",
            TotalScore = x.TotalScore,
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
