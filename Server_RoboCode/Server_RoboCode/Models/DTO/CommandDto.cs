namespace Server_RoboCode.Models.DTO
{
    public class CommandDto
    {
        public int CommandId { get; set; }
        public string Name { get; set; } = null!;
        public string Syntax { get; set; } = null!;
        public string? Description { get; set; }
    }
}
