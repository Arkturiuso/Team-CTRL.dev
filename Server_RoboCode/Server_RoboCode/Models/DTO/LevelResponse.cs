namespace Server_RoboCode.Models.DTO
{
    public class LevelResponse
    {
        public int LevelId { get; set; }

        // Конфигурация карты: стены, ключи, entrance, exit, размеры и препятствия.
        public object? MapData { get; set; }

        // Поля, вытащенные из map_data
        public string? LevelName { get; set; }
        public string? Description { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }

        /// <summary>Количество ключей уровня (колонка level.keys_count).</summary>
        public int KeysCount { get; set; }

        /// <summary>Количество монет уровня (колонка level.coins_count).</summary>
        public int CoinsCount { get; set; }

        public int DifficultyId { get; set; }
        public string DifficultyName { get; set; } = null!;

        public int LevelStatusId { get; set; }
        public string LevelStatusName { get; set; } = null!;

        /// <summary>
        /// Последовательная блокировка: уровень открыт, если он первый видимый
        /// или предыдущий по списку уже пройден этим игроком. Админу всегда false.
        /// </summary>
        public bool IsLocked { get; set; }

        public DateTime Created { get; set; }
        public int UserAttempts { get; set; } = 0;
        public int UserBestScore { get; set; } = 0;
        public List<CommandDto> AllowedCommands { get; set; } = new();
        public List<CommandDto> NewCommands { get; set; } = new();
    }
}
