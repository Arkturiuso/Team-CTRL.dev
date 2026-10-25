namespace Server_RoboCode.Models
{
    public class KnowledgeBase
    {
        public int UserId { get; set; }
        public int CommandId { get; set; }

        public AppUser User { get; set; } = null!;
        public Command Command { get; set; } = null!;
    }
}
