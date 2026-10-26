using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Controllers;

[Route("api/levelstatus")]
[ApiController]
public class LevelStatusController : ControllerBase
{
    private readonly RobocodeContext _context;
    private readonly Brain _brain;

    public LevelStatusController(RobocodeContext context, Brain brain)
    {
        _context = context;
        _brain = brain;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return await _brain.ProcessAsync(
            () => HandleGetAll(),
            "/api/levelstatus",
            "GET"
        );
    }

    private IActionResult HandleGetAll()
    {
        var data = _context.LevelStatuses
            .Select(s => new { LevelStatusId = s.LevelStatusId, Name = s.Name })
            .ToList();
            
        return Ok(new ApiResponse { Success = true, Data = data });
    }
}