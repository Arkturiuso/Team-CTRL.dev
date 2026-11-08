using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Controllers;

/// <summary>
/// Отчёт об активности игроков по уровням - выходной документ администратора
/// из эталона. Считается по попыткам и результатам, скрытые уровни тоже видно.
/// </summary>
[Route("api/admin/levels")]
[ApiController]
[Authorize(Roles = "admin")]
public class AdminActivityController : ControllerBase
{
    private readonly RobocodeContext _context;

    public AdminActivityController(RobocodeContext context) => _context = context;

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var levels = await _context.Levels.AsNoTracking()
            .OrderBy(l => l.LevelId)
            .ToListAsync();

        var statsByLevel = await _context.Attempts.AsNoTracking()
            .GroupBy(a => a.LevelId)
            .Select(g => new
            {
                LevelId = g.Key,
                Attempts = g.Count(),
                Successes = g.Count(a => a.AttemptStatusId == 2),
                UniquePlayers = g.Select(a => a.UserId).Distinct().Count(),
                AvgTicks = g.Average(a => (double?)a.TickCount) ?? 0
            })
            .ToListAsync();

        var bestScoreByLevel = await _context.Results.AsNoTracking()
            .GroupBy(r => r.LevelId)
            .Select(g => new { LevelId = g.Key, BestScore = g.Max(r => r.TotalScore) })
            .ToListAsync();

        var statsMap = statsByLevel.ToDictionary(s => s.LevelId);
        var bestMap = bestScoreByLevel.ToDictionary(s => s.LevelId);

        var report = levels.Select(level => new
        {
            levelId = level.LevelId,
            levelName = level.LevelName,
            attemptsCount = statsMap.TryGetValue(level.LevelId, out var s) ? s.Attempts : 0,
            successCount = statsMap.TryGetValue(level.LevelId, out s) ? s.Successes : 0,
            uniquePlayers = statsMap.TryGetValue(level.LevelId, out s) ? s.UniquePlayers : 0,
            avgTicks = Math.Round(statsMap.TryGetValue(level.LevelId, out s) ? s.AvgTicks : 0, 1),
            bestScore = bestMap.TryGetValue(level.LevelId, out var b) ? b.BestScore : 0
        }).ToList();

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Отчёт об активности игроков получен",
            Data = report
        });
    }
}
