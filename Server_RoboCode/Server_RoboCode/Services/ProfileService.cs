using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models;
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
        // 1. Получаем базовую инфу о пользователе + статус аккаунта
        var user = await _context.AppUsers
            .Include(u => u.AccountStatus)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return null;

        // 2. Получаем статистику игрока
        var stats = await _context.PlayerStatistics
            .FirstOrDefaultAsync(s => s.UserId == userId);

        // 3. Получаем позицию в лидерборде (ранг)
        var leaderboardEntry = await _context.Leaderboards
            .FirstOrDefaultAsync(l => l.UserId == userId);

        // 4. Получаем последние 10 попыток с уровнями и статусами
        var attempts = await _context.Attempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Submitted)
            .Take(10)
            .Include(a => a.Level)
            .Include(a => a.AttemptStatus)
            .ToListAsync();

        // 5. Собираем всё в DTO
        return new ProfileResponse
        {
            User = new UserInfo
            {
                Login = user.Login,
                RegistrationDate = user.Registration,
                AccountStatusName = MapStatusToRussian(user.AccountStatus?.Name),
                Role = user.Role,
                TotalStars = stats?.TotalScore ?? 0,
                LevelsPassedCount = stats?.LevelsPassed ?? 0
            },
            Stats = new UserStats
            {
                TotalScore = stats?.TotalScore ?? 0,
                LevelsPassed = stats?.LevelsPassed ?? 0,
                LastUpdate = stats?.LastUpdate ?? DateTime.UtcNow
            },
            RankPosition = leaderboardEntry?.Position,
            RecentAttempts = attempts.Select(a => new AttemptHistoryItem
            {
                LevelId = a.LevelId,
                LevelTitle = a.Level?.LevelName ?? $"Уровень {a.LevelId}",
                SubmittedAt = a.Submitted,
                StatusName = MapStatusToRussian(a.AttemptStatus?.Name),
                TickCount = a.TickCount
            }).ToList()
        };
    }

    // Переводит английские статусы из БД в русский текст для UI
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
}git a