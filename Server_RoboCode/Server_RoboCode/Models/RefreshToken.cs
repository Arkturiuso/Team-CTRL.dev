using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class RefreshToken
{
    public ulong RefreshTokenId { get; set; }

    public int UserId { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public bool Revoked { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
