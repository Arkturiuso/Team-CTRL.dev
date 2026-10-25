namespace Server_RoboCode.Models.DTO
{
    public class KnowledgeBaseResponse
    {
        public List<CommandDto> Unlocked { get; set; } = new();
        public List<CommandDto> Locked { get; set; } = new();
    }
}
