using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class PlayerStatistic
{
    public int UserId { get; set; }

    public int TotalScore { get; set; }

    public int LevelsPassed { get; set; }

    public DateTime LastUpdate { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
