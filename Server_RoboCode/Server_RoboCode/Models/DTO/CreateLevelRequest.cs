namespace Server_RoboCode.Models.DTO
{
    public class CreateLevelRequest
    {
        public object MapData { get; set; } = null!;
        public int DifficultyId { get; set; }
        public int LevelStatusId { get; set; } = 1;
    }
}
