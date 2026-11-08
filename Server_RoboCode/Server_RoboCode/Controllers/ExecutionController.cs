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
    /// Запуск программы робота: один запуск = один полный прогон лабиринта с входа.
    /// Ответ плоский по контракту: попытка, метрики, кадры, финальная позиция.
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
                Message = data.Success ? "Уровень пройден" : "Запуск завершён",
                Data = data
            });
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
