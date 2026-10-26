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
    
    public string Role { get; set; } = "player"; 

    public virtual AccountStatus AccountStatus { get; set; } = null!;
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
    public virtual Leaderboard? Leaderboard { get; set; }
    public virtual PlayerStatistic? PlayerStatistic { get; set; }
    public virtual ICollection<Result> Results { get; set; } = new List<Result>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<KnowledgeBase> KnowledgeBases { get; set; } = new List<KnowledgeBase>();
}