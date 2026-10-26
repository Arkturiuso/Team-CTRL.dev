using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

public class AttemptService : IAttemptService
{
    private readonly RobocodeContext _context;

    public AttemptService(RobocodeContext context)
    {
        _context = context;
    }

    public async Task<SubmitAttemptResponse> SubmitAsync(int userId, SubmitAttemptRequest request)
    {
        var levelExists = await _context.Levels.AnyAsync(l => l.LevelId == request.LevelId);
        if (!levelExists)
            throw new ArgumentException($"Уровень {request.LevelId} не найден");

        var statusName = request.Status.Trim().ToLowerInvariant();
        var statusId = statusName switch
        {
            "success" => 2,
            "error" => 3,
            "in_progress" => 1,
            _ => throw new ArgumentException("Status: success, error или in_progress")
        };

        string sourceCode;
        if (request.Commands is { Count: > 0 })
            sourceCode = string.Join("\n", request.Commands);
        else if (!string.IsNullOrWhiteSpace(request.SourceCode))
            sourceCode = request.SourceCode;
        else
            throw new ArgumentException("Нужны Commands или SourceCode");

        var linesCount = sourceCode
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Length;

        var stars = Math.Clamp(request.TotalScore, 0, 3);

        var attempt = new Attempt
        {
            UserId = userId,
            LevelId = request.LevelId,
            SourceCode = sourceCode,
            Submitted = DateTime.UtcNow,
            AttemptStatusId = statusId,
            TickCount = request.TickCount,
            LinesCount = linesCount,
            ErrorMessage = statusId == 3 ? request.ErrorMessage : null
        };

        _context.Attempts.Add(attempt);
        await _context.SaveChangesAsync();

        var unlocked = new List<CommandDto>();

        if (statusId == 2)
        {
            var existing = await _context.Results
                .FirstOrDefaultAsync(r => r.UserId == userId && r.LevelId == request.LevelId);

            if (existing == null)
            {
                _context.Results.Add(new Result
                {
                    UserId = userId,
                    LevelId = request.LevelId,
                    TickCount = request.TickCount,
                    TotalScore = stars,
                    Fixed = DateTime.UtcNow,
                    AttemptId = attempt.AttemptId
                });
            }
            else
            {
                if (stars >= existing.TotalScore)
                {
                    existing.TotalScore = stars;
                    existing.TickCount = request.TickCount;
                    existing.AttemptId = attempt.AttemptId;
                    existing.Fixed = DateTime.UtcNow;
                }
            }

            var levelCommandIds = await _context.LevelCommands
                .Where(lc => lc.LevelId == request.LevelId)
                .Select(lc => lc.CommandId)
                .ToListAsync();

            var already = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId && levelCommandIds.Contains(kb.CommandId))
                .Select(kb => kb.CommandId)
                .ToListAsync();

            var toAdd = levelCommandIds.Except(already).ToList();

            foreach (var cmdId in toAdd)
            {
                _context.KnowledgeBases.Add(new KnowledgeBase
                {
                    UserId = userId,
                    CommandId = cmdId
                });
            }

            await _context.SaveChangesAsync();

            if (toAdd.Count > 0)
            {
                unlocked = await _context.Commands
                    .Where(c => toAdd.Contains(c.CommandId))
                    .Select(c => new CommandDto
                    {
                        CommandId = c.CommandId,
                        Name = c.Name,
                        Syntax = c.Syntax,
                        Description = c.Description
                    })
                    .ToListAsync();
            }

            var stats = await _context.PlayerStatistics.FirstOrDefaultAsync(s => s.UserId == userId);
            if (stats != null)
            {
                stats.LevelsPassed = await _context.Results.CountAsync(r => r.UserId == userId);
                stats.TotalScore = await _context.Results
                    .Where(r => r.UserId == userId)
                    .SumAsync(r => r.TotalScore);
                stats.LastUpdate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // ✅ ОБНОВЛЯЕМ ТАБЛИЦУ LEADERBOARD
                await UpdateLeaderboardAsync(userId, stats.TotalScore);
            }
        }

        var currentStars = await _context.Results
            .Where(r => r.UserId == userId && r.LevelId == request.LevelId)
            .Select(r => (int?)r.TotalScore)
            .FirstOrDefaultAsync() ?? 0;

        return new SubmitAttemptResponse
        {
            AttemptId = attempt.AttemptId,
            LevelId = request.LevelId,
            Status = statusName,
            TickCount = request.TickCount,
            UserStars = currentStars,
            UnlockedCommands = unlocked
        };
    }

    // ✅ Метод для обновления позиции в leaderboard
    private async Task UpdateLeaderboardAsync(int userId, int totalScore)
    {
        var leaderboardEntry = await _context.Leaderboards
            .FirstOrDefaultAsync(l => l.UserId == userId);

        if (leaderboardEntry == null)
        {
            // Если игрока нет в leaderboard — добавляем
            var newPosition = await _context.Leaderboards
                .CountAsync(l => l.TotalScore > totalScore) + 1;

            _context.Leaderboards.Add(new Leaderboard
            {
                Position = newPosition,
                UserId = userId,
                Login = (await _context.AppUsers.FindAsync(userId))?.Login ?? "",
                TotalScore = totalScore,
                Updated = DateTime.UtcNow
            });
        }
        else
        {
            // Если игрок уже есть — обновляем score и пересчитываем позицию
            leaderboardEntry.TotalScore = totalScore;
            leaderboardEntry.Updated = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Пересчитываем позиции всех игроков
        var allEntries = await _context.Leaderboards
            .OrderByDescending(l => l.TotalScore)
            .ToListAsync();

        for (int i = 0; i < allEntries.Count; i++)
        {
            allEntries[i].Position = i + 1;
        }

        await _context.SaveChangesAsync();
    }
}