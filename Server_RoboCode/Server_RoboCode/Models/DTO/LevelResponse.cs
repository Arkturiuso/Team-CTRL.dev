namespace Server_RoboCode.Models.DTO
{
    public class LevelResponse
    {
        public int LevelId { get; set; }

        // Полный JSON карты как объект
        public object? MapData { get; set; }

        // Удобные поля, вытащенные из map_data
        public string? LevelName { get; set; }
        public string? Description { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }

        public int DifficultyId { get; set; }
        public string DifficultyName { get; set; } = null!;

        public int LevelStatusId { get; set; }
        public string LevelStatusName { get; set; } = null!;

        public DateTime Created { get; set; }
    }
}
