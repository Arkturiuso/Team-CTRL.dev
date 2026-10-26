using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Models.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server_RoboCode.Services;

public class ProfileService : IProfileService
{
    private readonly RobocodeContext _context;

    public ProfileService(RobocodeContext context)
    {
        _context = context;
    }

    public async Task<ProfileResponse?> GetProfileAsync(int userId)
    {
        var user = await _context.AppUsers
            .Include(u => u.AccountStatus)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return null;

        var completedLevelIds = await _context.Results
            .Where(r => r.UserId == userId)
            .Select(r => r.LevelId)
            .ToHashSetAsync();

        var attempts = await _context.Attempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Submitted)
            .Take(10)
            .Include(a => a.Level)
            .Include(a => a.AttemptStatus)
            .ToListAsync();

        var userResultStats = await _context.Results
            .Where(r => r.UserId == userId)
            .GroupBy(r => r.UserId)
            .Select(g => new
            {
                TotalStars = g.Sum(r => r.TotalScore),
                LevelsPassed = g.Count()
            })
            .FirstOrDefaultAsync();

        int? rankPosition = null;
        int actualTotalStars = 0;
        int actualLevelsPassed = 0;

        if (userResultStats != null && userResultStats.TotalStars > 0)
        {
            actualTotalStars = userResultStats.TotalStars;
            actualLevelsPassed = userResultStats.LevelsPassed;

            rankPosition = await _context.Results
                .GroupBy(r => r.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    TotalStars = g.Sum(r => r.TotalScore),
                    LevelsPassed = g.Count()
                })
                .CountAsync(x =>
                    x.TotalStars > actualTotalStars ||
                    (x.TotalStars == actualTotalStars && x.LevelsPassed > actualLevelsPassed) ||
                    (x.TotalStars == actualTotalStars && x.LevelsPassed == actualLevelsPassed && x.UserId < userId)
                ) + 1;
        }

        return new ProfileResponse
        {
            User = new UserInfo
            {
                Login = user.Login,
                RegistrationDate = user.Registration,
                AccountStatusName = MapStatusToRussian(user.AccountStatus?.Name),
                Role = user.Role,
                TotalStars = actualTotalStars,
                LevelsPassedCount = actualLevelsPassed
            },
            Stats = new UserStats
            {
                TotalScore = actualTotalStars,
                LevelsPassed = actualLevelsPassed,
                LastUpdate = DateTime.UtcNow
            },
            RankPosition = rankPosition,
            RecentAttempts = attempts.Select(a => new AttemptHistoryItem
            {
                LevelId = a.LevelId,
                LevelTitle = a.Level?.LevelName ?? $"Уровень {a.LevelId}",
                SubmittedAt = a.Submitted,
                StatusName = MapStatusToRussian(a.AttemptStatus?.Name),
                TickCount = a.TickCount,
                IsSuccess = a.AttemptStatus?.Name?.ToLowerInvariant() == "success",
                IsLevelCompleted = completedLevelIds.Contains(a.LevelId)
            }).ToList()
        };
    }

    private static string MapStatusToRussian(string? dbStatus)
    {
        return dbStatus?.ToLowerInvariant() switch
        {
            "active" => "Активен",
            "blocked" => "Заблокирован",
            "success" => "Успех",
            "error" or "failed" => "Ошибка",
            "pending" or "in_progress" => "В процессе",
            _ => dbStatus ?? "Неизвестно"
        };
    }
}