using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LevelController : ControllerBase
{
    private readonly ILevelService _levelService;
    private readonly Brain _brain;
    private readonly RobocodeContext _context;

    public LevelController(ILevelService levelService, Brain brain, RobocodeContext context)
    {
        _levelService = levelService;
        _brain = brain;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllLevels()
    {
        return await _brain.ProcessAsync(
            () => HandleGetAllLevels(),
            "/api/level",
            "GET"
        );
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetLevelById(int id)
    {
        return await _brain.ProcessAsync(
            () => HandleGetLevelById(id),
            $"/api/level/{id}",
            "GET"
        );
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int userId))
            return null;
        return userId;
    }

    private IActionResult HandleGetAllLevels()
    {
        var userId = GetCurrentUserId();
        var levels = _levelService.GetAllLevelsAsync(userId).Result;

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Список уровней получен",
            Data = levels
        });
    }

    private IActionResult HandleGetLevelById(int id)
    {
        var userId = GetCurrentUserId();
        var level = _levelService.GetLevelByIdAsync(id, userId).Result;

        if (level == null)
        {
            return NotFound(new ApiResponse
            {
                Success = false,
                Message = $"Уровень с ID {id} не найден"
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Уровень получен",
            Data = level
        });
    }

    private IActionResult HandleCreateLevel(CreateLevelRequest request)
    {
        if (request == null || request.MapData == null)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "MapData обязателен"
            });
        }

        if (request.DifficultyId <= 0)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "DifficultyId обязателен и должен быть больше 0"
            });
        }

        try
        {
            var level = _levelService.CreateLevelAsync(request).Result;

            return Created($"/api/level/{level.LevelId}", new ApiResponse
            {
                Success = true,
                Message = "Уровень успешно создан",
                Data = level
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Ошибка при создании уровня",
                Data = new { Error = ex.InnerException?.Message ?? ex.Message }
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateLevel([FromBody] CreateLevelRequest request)
    {
        return await _brain.ProcessAsync(
            (CreateLevelRequest req) => HandleCreateLevel(req),
            request,
            "/api/level",
            "POST"
        );
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteLevel(int id)
    {
        return await _brain.ProcessAsync(
            () => HandleDeleteLevel(id),
            $"/api/level/{id}",
            "DELETE"
        );
    }

    private IActionResult HandleDeleteLevel(int id)
    {
        var level = _context.Levels.Find(id);
        if (level == null)
        {
            return NotFound(new ApiResponse
            {
                Success = false,
                Message = "Уровень не найден"
            });
        }

        var levelCommands = _context.LevelCommands.Where(lc => lc.LevelId == id).ToList();
        if (levelCommands.Any())
        {
            _context.LevelCommands.RemoveRange(levelCommands);
        }

        // Удаляем попытки и результаты, связанные с уровнем
        var attempts = _context.Attempts.Where(a => a.LevelId == id).ToList();
        if (attempts.Any())
        {
            _context.Attempts.RemoveRange(attempts);
        }

        var results = _context.Results.Where(r => r.LevelId == id).ToList();
        if (results.Any())
        {
            _context.Results.RemoveRange(results);
        }

        _context.Levels.Remove(level);
        _context.SaveChanges();

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Уровень успешно удален"
        });
    }
}