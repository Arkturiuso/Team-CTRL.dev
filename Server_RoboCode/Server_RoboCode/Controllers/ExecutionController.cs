using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ExecutionController : ControllerBase
{
    private readonly IGameRunService _gameRuns;

    public ExecutionController(IGameRunService gameRuns) => _gameRuns = gameRuns;

    /// <summary>
    /// Запуск программы. Робот продолжает путь с того места, где остановился в прошлый раз.
    /// Один запуск - один тик; тики и монеты влияют только на звёзды.
    /// </summary>
    [HttpPost("run")]
    public async Task<IActionResult> Run([FromBody] RunCodeRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        try
        {
            var data = await _gameRuns.RunAsync(userId, User.IsInRole("admin"), request);

            return Ok(new ApiResponse
            {
                Success = true,
                Message = data.Execution.Success ? "Уровень пройден" : "Запуск завершён",
                Data = data
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
    }

    /// <summary>Текущее состояние робота на уровне (позиция, враги, собранные монеты и ключи).</summary>
    [HttpGet("state/{levelId:int}")]
    public async Task<IActionResult> GetState(int levelId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        try
        {
            var state = await _gameRuns.GetStateAsync(userId, levelId);
            return Ok(new ApiResponse { Success = true, Data = state });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
    }

    /// <summary>Сброс прохождения уровня: робот снова на входе, монеты и ключи возвращаются.</summary>
    [HttpPost("reset/{levelId:int}")]
    public async Task<IActionResult> Reset(int levelId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        try
        {
            var state = await _gameRuns.ResetAsync(userId, levelId);
            return Ok(new ApiResponse { Success = true, Message = "Уровень сброшен", Data = state });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(claim) && int.TryParse(claim, out userId);
    }
}
