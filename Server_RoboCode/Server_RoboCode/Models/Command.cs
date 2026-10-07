using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Command
{
    public int CommandId { get; set; }

    public string Name { get; set; } = null!;

    public string Syntax { get; set; } = null!;

    public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
