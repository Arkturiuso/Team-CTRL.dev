using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Services;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Server_RoboCode.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Требует авторизации (наличие валидного токена/сессии)
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly Brain _brain;

    public ProfileController(IProfileService profileService, Brain brain)
    {
        _profileService = profileService;
        _brain = brain;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        return await _brain.ProcessAsync(
            () => HandleGetProfile(),
            "/api/profile",
            "GET"
        );
    }

    private IActionResult HandleGetProfile()
    {
        // 1. Получаем ID пользователя из Claims (токена авторизации)
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new ApiResponse
            {
                Success = false,
                Message = "Пользователь не авторизован или токен некорректен"
            });
        }

        // 2. Вызываем сервис для получения данных
        // Сервис сам сходит в БД, соберет всё и вернет готовый DTO
        var profile = _profileService.GetProfileAsync(userId).Result;

        if (profile == null)
        {
            return NotFound(new ApiResponse
            {
                Success = false,
                Message = "Профиль не найден"
            });
        }

        // 3. Возвращаем успешный ответ
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Профиль загружен успешно",
            Data = profile
        });
    }
}