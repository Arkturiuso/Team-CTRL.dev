using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Controllers;

/// <summary>
/// Справка о прохождении уровня - выходной документ эталона.
/// Отдаёт лучший результат игрока по уровню: тики, строки, ключи, балл, дата фиксации.
/// </summary>
[Route("api/levels")]
[ApiController]
[Authorize]
public class LevelsController : ControllerBase
{
    private readonly RobocodeContext _context;

    public LevelsController(RobocodeContext context) => _context = context;

    [HttpGet("{id:int}/certificate")]
    public async Task<IActionResult> GetCertificate(int id)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        var level = await _context.Levels
            .Include(l => l.Difficulty)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.LevelId == id);

        if (level == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Уровень {id} не найден" });

        var levelName = level.LevelName;

        var result = await _context.Results
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId && r.LevelId == id);

        // Понятная пустота вместо 500: результата нет - справка говорит, что проходить ещё нечего.
        if (result == null)
        {
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Результата по уровню пока нет",
                Data = new
                {
                    levelId = id,
                    levelName,
                    hasResult = false,
                    tickCount = (int?)null,
                    linesCount = (int?)null,
                    keysCollected = (int?)null,
                    score = (int?)null,
                    fixedAt = (DateTime?)null
                }
            });
        }

        int? linesCount = await _context.Attempts
            .AsNoTracking()
            .Where(a => a.AttemptId == result.AttemptId)
            .Select(a => a.LinesCount)
            .FirstOrDefaultAsync();

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Справка о прохождении уровня получена",
            Data = new
            {
                levelId = id,
                levelName,
                hasResult = true,
                tickCount = result.TickCount,
                linesCount,
                keysCollected = result.KeysCollected,
                keysTotal = level.KeysCount,
                score = result.TotalScore,
                difficulty = level.Difficulty?.Name,
                attemptId = result.AttemptId,
                fixedAt = result.Fixed
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
