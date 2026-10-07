using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Difficulty
{
    public int DifficultyId { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Level> Levels { get; set; } = new List<Level>();
}
