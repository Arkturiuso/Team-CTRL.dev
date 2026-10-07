using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class AttemptStatus
{
    public int AttemptStatusId { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
}
