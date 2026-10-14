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


    private IActionResult HandleGetAllLevels()
    {
        var levels = _levelService.GetAllLevelsAsync().Result;

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Список уровней получен",
            Data = levels
        });
    }

    private IActionResult HandleGetLevelById(int id)
    {
        var level = _levelService.GetLevelByIdAsync(id).Result;

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
}