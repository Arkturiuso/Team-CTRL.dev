using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Attempt
{
    public int AttemptId { get; set; }

    public int UserId { get; set; }

    public int LevelId { get; set; }

    public string SourceCode { get; set; } = null!;

    public DateTime Submitted { get; set; }

    public int AttemptStatusId { get; set; }

    public int? TickCount { get; set; }

    public int? LinesCount { get; set; }

    public string? ErrorMessage { get; set; }

    public virtual AttemptStatus AttemptStatus { get; set; } = null!;

    public virtual Level Level { get; set; } = null!;

    public virtual ICollection<Result> Results { get; set; } = new List<Result>();

    public virtual AppUser User { get; set; } = null!;
}
