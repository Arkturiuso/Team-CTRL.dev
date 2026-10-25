namespace Server_RoboCode.Models
{
    public class LevelCommand
    {
        public int LevelId { get; set; }
        public int CommandId { get; set; }

        public Level Level { get; set; } = null!;
        public Command Command { get; set; } = null!;
    }
}
