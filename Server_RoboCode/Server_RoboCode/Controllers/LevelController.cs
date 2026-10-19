using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LevelController : ControllerBase
{
    private readonly ILevelService _levelService;
    private readonly Brain _brain;

    public LevelController(ILevelService levelService, Brain brain)
    {
        _levelService = levelService;
        _brain = brain;
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
    public async Task<IActionResult> CreateLevel([FromBody] CreateLevelRequest request)
    {
        return await _brain.ProcessAsync(
            (CreateLevelRequest req) => HandleCreateLevel(req),
            request,
            "/api/level",
            "POST"
        );
    }
}