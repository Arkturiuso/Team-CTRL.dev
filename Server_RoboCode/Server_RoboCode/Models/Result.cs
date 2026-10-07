using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Result
{
    public int UserId { get; set; }

    public int LevelId { get; set; }

    public int TickCount { get; set; }

    public int KeysCollected { get; set; }

    public int TotalScore { get; set; }

    public DateTime Fixed { get; set; }

    public int? AttemptId { get; set; }

    public virtual Attempt? Attempt { get; set; }

    public virtual Level Level { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
