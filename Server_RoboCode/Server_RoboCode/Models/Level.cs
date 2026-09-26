using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Level
{
    public int LevelId { get; set; }

    public string Title { get; set; } = null!;

    public int MapWidth { get; set; }

    public int MapHeight { get; set; }

    public string MapConfig { get; set; } = null!;

    public int KeysCount { get; set; }

    public int DifficultyId { get; set; }

    public int LevelStatusId { get; set; }

    public DateTime Created { get; set; }

    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    public virtual Difficulty Difficulty { get; set; } = null!;

    public virtual LevelStatus LevelStatus { get; set; } = null!;

    public virtual ICollection<Result> Results { get; set; } = new List<Result>();
}
