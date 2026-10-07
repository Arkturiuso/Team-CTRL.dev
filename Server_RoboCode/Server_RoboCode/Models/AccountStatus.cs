using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class AccountStatus
{
    public int AccountStatusId { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<AppUser> AppUsers { get; set; } = new List<AppUser>();
}
