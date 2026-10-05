using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
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
            if (string.IsNullOrEmpty(request.Login) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new ApiResponse { Success = false, Message = "Логин и пароль обязательны" });

            if (request.Login.Length > 64)
                return BadRequest(new ApiResponse { Success = false, Message = "Логин слишком длинный (макс. 64)" });

            if (_context.AppUsers.Any(u => u.Login == request.Login))
                return Conflict(new ApiResponse { Success = false, Message = "Этот логин уже занят" });

            try
            {
                var newUser = new AppUser
                {
                    Login = request.Login,
                    Password = request.Password,
                    Registration = DateTime.UtcNow,
                    AccountStatusId = 1,
                    Role = "player"
                };

                _context.AppUsers.Add(newUser);
                _context.SaveChanges();

                _context.PlayerStatistics.Add(new PlayerStatistic
                {
                    UserId = newUser.UserId,
                    TotalScore = 0,
                    LevelsPassed = 0,
                    LastUpdate = DateTime.UtcNow
                });

                int nextPosition = _context.Leaderboards.Any()
                    ? _context.Leaderboards.Max(l => l.Position) + 1
                    : 1;

                _context.Leaderboards.Add(new Leaderboard
                {
                    Position = nextPosition,
                    UserId = newUser.UserId,
                    Login = newUser.Login,
                    TotalScore = 0,
                    Updated = DateTime.UtcNow
                });

                var refreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
                var tokenHash = ComputeSha256Hash(refreshTokenValue);

                _context.RefreshTokens.Add(new RefreshToken
                {
                    UserId = newUser.UserId,
                    TokenHash = tokenHash,
                    ExpiresAt = DateTime.UtcNow.AddDays(7),
                    Revoked = false
                });

                _context.SaveChanges();

                return Created($"/api/users/{newUser.UserId}", new ApiResponse
                {
                    Success = true,
                    Message = "Регистрация успешна",
                    Data = new
                    {
                        UserId = newUser.UserId,
                        Login = newUser.Login,
                        Role = newUser.Role,
                        Registration = newUser.Registration,
                        Tokens = new TokenResponse
                        {
                            RefreshToken = refreshTokenValue,
                            ExpiresAt = DateTime.UtcNow.AddDays(7)
                        }
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

        private string ComputeSha256Hash(string rawData)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }
    }
}
