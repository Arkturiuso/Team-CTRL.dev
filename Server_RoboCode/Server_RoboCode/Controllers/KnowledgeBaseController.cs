using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Services;
using System.Security.Claims;

namespace Server_RoboCode.Controllers
{
    [Route("api/knowledge-base")]
    [ApiController]
    [Authorize]
    public class KnowledgeBaseController : ControllerBase
    {
        private readonly IKnowledgeBaseService _service;
        private readonly Brain _brain;

        public KnowledgeBaseController(IKnowledgeBaseService service, Brain brain)
        {
            _service = service;
            _brain = brain;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return await _brain.ProcessAsync(
                () => HandleGet(),
                "/api/knowledge-base",
                "GET"
            );
        }

        private IActionResult HandleGet()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Не авторизован" });

            var data = _service.GetForUserAsync(userId).Result;

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "База знаний получена",
                Data = data
            });
        }

        [HttpGet("all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll()
        {
            return await _brain.ProcessAsync(
                () => HandleGetAll(),
                "/api/knowledge-base/all",
                "GET"
            );
        }

        private IActionResult HandleGetAll()
        {
            var data = _service.GetAllCommandsAsync().Result;

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Все команды получены",
                Data = data
            });
        }
    }
}