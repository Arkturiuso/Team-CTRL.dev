using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Controllers;

/// <summary>
/// Справка об истории попыток игрока - выходной документ эталона.
/// Пагинация обязательна: страница по 10 попыток, сортировка от новых к старым.
/// </summary>
[Route("api/attempts")]
[ApiController]
[Authorize]
public class AttemptsController : ControllerBase
{
    private const int PageSize = 10;

    private readonly RobocodeContext _context;

    public AttemptsController(RobocodeContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetHistory([FromQuery] int? levelId, [FromQuery] int page = 1)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        if (page < 1) page = 1;

        var query = _context.Attempts
            .AsNoTracking()
            .Where(a => a.UserId == userId);

        if (levelId.HasValue)
            query = query.Where(a => a.LevelId == levelId.Value);

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)PageSize);

        var rows = await query
            .OrderByDescending(a => a.Submitted)
            .ThenByDescending(a => a.AttemptId)
            .Skip((page - 1) * PageSize)
            .Take(PageSize)
            .Select(a => new
            {
                attemptId = a.AttemptId,
                levelId = a.LevelId,
                sourceCode = a.SourceCode,
                submitted = a.Submitted,
                status = a.AttemptStatus.Name,
                ticks = a.TickCount,
                linesCount = a.LinesCount
            })
            .ToListAsync();

        // Имя уровня - вычисляемое поле из map_data, тянем справочником по id.
        var levelIds = rows.Select(r => r.levelId).Distinct().ToList();
        var names = await _context.Levels.AsNoTracking()
            .Where(l => levelIds.Contains(l.LevelId))
            .ToDictionaryAsync(l => l.LevelId, l => l.LevelName);

        var items = rows.Select(r => new
        {
            r.attemptId,
            r.levelId,
            levelName = names.TryGetValue(r.levelId, out var name) ? name : $"Уровень {r.levelId}",
            r.sourceCode,
            r.submitted,
            r.status,
            r.ticks,
            r.linesCount
        }).ToList();

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "История попыток получена",
            Data = new
            {
                items,
                page,
                pageSize = PageSize,
                totalAttempts = total,
                totalPages
            }
        });
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(claim) && int.TryParse(claim, out userId);
    }
}
