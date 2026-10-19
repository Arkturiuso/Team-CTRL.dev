using System;

namespace Server_RoboCode.Models.DTO
{
    public class TokenResponse
    {
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
}
