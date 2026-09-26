using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using System.Linq;
using System.Threading.Tasks;

namespace Server_RoboCode.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly RobocodeContext _context;
        private readonly Brain _brain;

        public AuthController(RobocodeContext context, Brain brain)
        {
            _context = context;
            _brain = brain;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            return await _brain.ProcessAsync(
                (LoginRequest req) => HandleLogin(req),
                request,
                "/api/auth/login",
                "POST"
            );
        }

        private IActionResult HandleLogin(LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Login) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Логин и пароль обязательны"
                });
            }

            var user = _context.AppUsers
                .Include(u => u.Role)
                .Include(u => u.AccountStatus)
                .FirstOrDefault(u => u.Login == request.Login && u.Password == request.Password);

            if (user == null)
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "Неверный логин или пароль"
                });
            }

            if (user.AccountStatusId != 1)
            {
                return StatusCode(403, new ApiResponse
                {
                    Success = false,
                    Message = "Аккаунт заблокирован"
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Авторизация успешна",
                Data = new
                {
                    UserId = user.UserId,
                    Login = user.Login,
                    RoleId = user.RoleId,
                    RoleName = user.Role.Name,
                    Registration = user.Registration
                }
            });
        }
    }
}