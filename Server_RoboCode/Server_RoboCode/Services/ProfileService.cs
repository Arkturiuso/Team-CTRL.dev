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

        var stats = await _context.PlayerStatistics
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        int totalScore = stats?.TotalScore ?? 0;
        int levelsPassed = stats?.LevelsPassed ?? 0;
        DateTime lastUpdate = stats?.LastUpdate ?? DateTime.UtcNow;

        // Позиция в рейтинге = место по сумме баллов в player_statistics (эталон).
        int? rankPosition = totalScore > 0 || levelsPassed > 0
            ? await _context.PlayerStatistics.AsNoTracking().CountAsync(s =>
                s.TotalScore > totalScore ||
                (s.TotalScore == totalScore && s.LevelsPassed > levelsPassed) ||
                (s.TotalScore == totalScore && s.LevelsPassed == levelsPassed && s.UserId < userId)) + 1
            : null;

        return new ProfileResponse
        {
            User = new UserInfo
            {
                Login = user.Login,
                RegistrationDate = user.Registration,
                AccountStatusName = MapStatusToRussian(user.AccountStatus?.Name),
                Role = user.Role,
                TotalScore = totalScore,
                LevelsPassedCount = levelsPassed
            },
            Stats = new UserStats
            {
                TotalScore = totalScore,
                LevelsPassed = levelsPassed,
                LastUpdate = lastUpdate
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