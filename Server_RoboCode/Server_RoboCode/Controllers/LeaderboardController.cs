using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly Brain _brain;

    public LeaderboardController(ILeaderboardService leaderboardService, Brain brain)
    {
        _leaderboardService = leaderboardService;
        _brain = brain;
    }

    /// <summary>
    /// Список лидеров (пагинация по 10)
    /// </summary>
    /// <param name="page">Номер страницы, с 1 (по умолчанию 1)</param>
    /// <param name="pageSize">Сколько игроков на странице (по умолчанию 10, макс 50)</param>
    [HttpGet]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        return await _brain.ProcessAsync(
            () => HandleGetLeaderboard(page, pageSize),
            $"/api/leaderboard?page={page}&pageSize={pageSize}",
            "GET"
        );
    }

    private IActionResult HandleGetLeaderboard(int page, int pageSize)
    {
        var data = _leaderboardService.GetLeaderboardAsync(page, pageSize).Result;

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Список лидеров получен",
            Data = data
        });
    }
}