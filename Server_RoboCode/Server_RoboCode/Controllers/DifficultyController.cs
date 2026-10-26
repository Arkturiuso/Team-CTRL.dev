using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Controllers;

[Route("api/difficulty")]
[ApiController]
public class DifficultyController : ControllerBase
{
    private readonly RobocodeContext _context;
    private readonly Brain _brain;

    public DifficultyController(RobocodeContext context, Brain brain)
    {
        _context = context;
        _brain = brain;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return await _brain.ProcessAsync(
            () => HandleGetAll(),
            "/api/difficulty",
            "GET"
        );
    }

    private IActionResult HandleGetAll()
    {
        var data = _context.Difficulties
            .Select(d => new { DifficultyId = d.DifficultyId, Name = d.Name })
            .ToList();
            
        return Ok(new ApiResponse { Success = true, Data = data });
    }
}