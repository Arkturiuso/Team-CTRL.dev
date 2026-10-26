using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;

namespace Server_RoboCode.Controllers;

[Route("api/users")]
[ApiController]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly Brain _brain;

    public UsersController(IUserService userService, Brain brain)
    {
        _userService = userService;
        _brain = brain;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return await _brain.ProcessAsync(
            () => HandleGetAll(),
            "/api/users",
            "GET"
        );
    }

    private IActionResult HandleGetAll()
    {
        var data = _userService.GetAllUsersAsync().Result;
        return Ok(new ApiResponse { Success = true, Data = data });
    }

    [HttpPut("{userId}/status")]
    public async Task<IActionResult> UpdateStatus(int userId, [FromBody] UpdateUserStatusDto dto)
    {
        return await _brain.ProcessAsync(
            () => HandleUpdateStatus(userId, dto),
            $"/api/users/{userId}/status",
            "PUT"
        );
    }

    private IActionResult HandleUpdateStatus(int userId, UpdateUserStatusDto dto)
    {
        var success = _userService.UpdateUserStatusAsync(userId, dto.AccountStatusId).Result;
        
        if (!success)
            return NotFound(new ApiResponse { Success = false, Message = "Пользователь не найден" });

        return Ok(new ApiResponse 
        { 
            Success = true, 
            Message = dto.AccountStatusId == 1 ? "Пользователь разблокирован" : "Пользователь заблокирован" 
        });
    }
}