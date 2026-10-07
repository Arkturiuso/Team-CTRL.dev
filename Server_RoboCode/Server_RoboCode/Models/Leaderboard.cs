using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Leaderboard
{
    public int Position { get; set; }

    public int UserId { get; set; }

    public string Login { get; set; } = null!;

    public int TotalScore { get; set; }

    public DateTime Updated { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
