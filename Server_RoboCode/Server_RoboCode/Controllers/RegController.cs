using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Server_RoboCode.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly RobocodeContext _context;
        private readonly Brain _brain;

        public RegisterController(RobocodeContext context, Brain brain)
        {
            _context = context;
            _brain = brain;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            return await _brain.ProcessAsync(
                (RegisterRequest req) => HandleRegister(req),
                request,
                "/api/register",
                "POST"
            );
        }

        private IActionResult HandleRegister(RegisterRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Login) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Логин и пароль обязательны"
                });
            }

            if (request.Login.Length > 30)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Логин слишком длинный (макс. 30 символа)"
                });
            }

            if (request.Password.Length > 50)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Пароль слишком длинный (макс. 50 символа)"
                });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Пароль слишком короткий (мин. 8 символа)"
                });
            }

            if (_context.AppUsers.Any(u => u.Login == request.Login))
            {
                return Conflict(new ApiResponse
                {
                    Success = false,
                    Message = "Этот логин уже занят"
                });
            }

            try
            {
                var newUser = new AppUser
                {
                    Login = request.Login,
                    Password = request.Password,
                    Registration = DateTime.UtcNow,
                    AccountStatusId = 1,
                    RoleId = 1
                };

                _context.AppUsers.Add(newUser);
                _context.SaveChanges();

                var stats = new PlayerStatistic
                {
                    UserId = newUser.UserId,
                    TotalScore = 0,
                    LevelsPassed = 0,
                    LastUpdate = DateTime.UtcNow
                };
                _context.PlayerStatistics.Add(stats);

                var maxPos = _context.Leaderboards.Any()
                    ? _context.Leaderboards.Max(l => l.Position)
                    : 0;

                var leaderboardEntry = new Leaderboard
                {
                    Position = maxPos + 1,
                    UserId = newUser.UserId,
                    Login = newUser.Login,
                    TotalScore = 0,
                    Updated = DateTime.UtcNow
                };
                _context.Leaderboards.Add(leaderboardEntry);

                _context.SaveChanges();

                return Created($"/api/users/{newUser.UserId}", new ApiResponse
                {
                    Success = true,
                    Message = "Регистрация успешна",
                    Data = new
                    {
                        UserId = newUser.UserId,
                        Login = newUser.Login,
                        RoleId = newUser.RoleId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = "Ошибка сервера при регистрации",
                    Data = new { Error = ex.InnerException?.Message ?? ex.Message }
                });
            }
        }
    }
}
