using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            if (string.IsNullOrEmpty(request.Login) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new ApiResponse { Success = false, Message = "Логин и пароль обязательны" });

            var user = _context.AppUsers
                .Include(u => u.AccountStatus)
                .FirstOrDefault(u => u.Login == request.Login && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new ApiResponse { Success = false, Message = "Неверный логин или пароль" });

            if (user.AccountStatusId != 1) // 1 = active
                return StatusCode(403, new ApiResponse { Success = false, Message = "Аккаунт заблокирован" });

            var refreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var tokenHash = ComputeSha256Hash(refreshTokenValue);

            var tokenEntity = new RefreshToken
            {
                UserId = user.UserId,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                Revoked = false
            };

            _context.RefreshTokens.Add(tokenEntity);
            _context.SaveChanges();

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Авторизация успешна",
                Data = new
                {
                    UserId = user.UserId,
                    Login = user.Login,
                    Role = user.Role,
                    Tokens = new TokenResponse
                    {
                        RefreshToken = refreshTokenValue,
                        ExpiresAt = tokenEntity.ExpiresAt
                    }
                }
            });
        }

        private string ComputeSha256Hash(string rawData)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }
    }
}