using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;

namespace Server_RoboCode.Services;

public interface ILevelAccessService
{
    Task<HashSet<int>> GetLockedLevelIdsAsync(int userId);
    Task<bool> IsLockedAsync(int userId, int levelId);
    Task EnsureUnlockedAsync(int userId, int levelId);
}

/// <summary>
/// Последовательная блокировка уровней: видимые игроку уровни (status != hidden)
/// сортируются по id; первый открыт, каждый следующий открыт только если предыдущий
/// по этому списку уже пройден (есть запись result) или сам уже пройден.
/// Админ под блокировку не попадает - это решают вызывающие через isAdmin.
/// </summary>
public sealed class LevelAccessService : ILevelAccessService
{
    private const int HiddenStatusId = 3;

    private readonly RobocodeContext _context;

    public LevelAccessService(RobocodeContext context) => _context = context;

    public async Task<HashSet<int>> GetLockedLevelIdsAsync(int userId)
    {
        var visibleLevelIds = await _context.Levels
            .Where(l => l.LevelStatusId != HiddenStatusId)
            .OrderBy(l => l.LevelId)
            .Select(l => l.LevelId)
            .ToListAsync();

        var passedLevelIds = (await _context.Results
            .Where(r => r.UserId == userId)
            .Select(r => r.LevelId)
            .ToListAsync())
            .ToHashSet();

        var locked = new HashSet<int>();
        int? previousLevelId = null;

        foreach (var levelId in visibleLevelIds)
        {
            var unlocked = previousLevelId == null
                           || passedLevelIds.Contains(levelId)
                           || passedLevelIds.Contains(previousLevelId.Value);

            if (!unlocked) locked.Add(levelId);
            previousLevelId = levelId;
        }

        return locked;
    }

    public async Task<bool> IsLockedAsync(int userId, int levelId)
        => (await GetLockedLevelIdsAsync(userId)).Contains(levelId);

    /// <summary>Авторитетная проверка для run/state/reset: игрок не запускает закрытый уровень.</summary>
    public async Task EnsureUnlockedAsync(int userId, int levelId)
    {
        if (await IsLockedAsync(userId, levelId))
            throw new ArgumentException("Уровень заблокирован - пройдите предыдущий");
    }
}
