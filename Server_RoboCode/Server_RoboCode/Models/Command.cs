using System.Collections.Generic;

namespace Server_RoboCode.Models;

public partial class Command
{
    public int CommandId { get; set; }
    public string Name { get; set; } = null!;
    public string Syntax { get; set; } = null!;
    public string? Description { get; set; }
    public virtual ICollection<KnowledgeBase> KnowledgeBases { get; set; } = new List<KnowledgeBase>();
}