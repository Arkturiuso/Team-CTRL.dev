using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AttemptController : ControllerBase
{
    private readonly IAttemptService _attemptService;
    private readonly Brain _brain;

    public AttemptController(IAttemptService attemptService, Brain brain)
    {
        _attemptService = attemptService;
        _brain = brain;
    }

    /// <summary>
    /// Отправка результата прохождения уровня (тики + код/команды + звёзды).
    /// При success — запись result и разблокировка команд уровня в knowledge_base.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitAttemptRequest request)
    {
        return await _brain.ProcessAsync(
            () => HandleSubmit(request),
            "/api/attempt",
            "POST"
        );
    }

    private IActionResult HandleSubmit(SubmitAttemptRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

        try
        {
            var data = _attemptService.SubmitAsync(userId, request).Result;
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Попытка сохранена",
                Data = data
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
    }
}