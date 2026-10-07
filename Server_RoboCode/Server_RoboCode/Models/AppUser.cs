using System;
using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class AppUser
{
    public int UserId { get; set; }
    public string Login { get; set; } = null!;
    public string Password { get; set; } = null!;
    public DateTime Registration { get; set; }
    public int AccountStatusId { get; set; }

    // ИСПРАВЛЕНИЕ: Роль теперь хранится прямо в пользователе как строка/enum
    // В MySQL это enum('player','admin'), в C# маппим в string или свой enum
    public string Role { get; set; } = "player";

    public virtual AccountStatus AccountStatus { get; set; } = null!;
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
    public virtual Leaderboard? Leaderboard { get; set; }
    public virtual PlayerStatistic? PlayerStatistic { get; set; }
    public virtual ICollection<Result> Results { get; set; } = new List<Result>();

    // УДАЛЕНО: public virtual Role Role { get; set; } 
    // УДАЛЕНО: public int RoleId { get; set; }

    public virtual ICollection<Command> Commands { get; set; } = new List<Command>();
}
