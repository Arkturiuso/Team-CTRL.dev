using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Server_RoboCode.Models;

public partial class Level
{
    public int LevelId { get; set; }

    // ИСПРАВЛЕНИЕ: Вместо Title, MapWidth, MapHeight, MapConfig теперь один JSON
    public string MapData { get; set; } = null!;

    public int DifficultyId { get; set; }
    public int LevelStatusId { get; set; }
    public DateTime Created { get; set; }

    public string? LevelName
    {
        get
        {
            try
            {
                using var doc = JsonDocument.Parse(MapData);
                return doc.RootElement.GetProperty("level_name").GetString();
            }
            catch
            {
                return $"Уровень {LevelId}";
            }
        }
    }

    public virtual Difficulty Difficulty { get; set; } = null!;
    public virtual LevelStatus LevelStatus { get; set; } = null!;
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
    public virtual ICollection<Result> Results { get; set; } = new List<Result>();
}