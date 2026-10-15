using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;
using System.Text.Json;

namespace Server_RoboCode.Services;

public class LevelService : ILevelService
{
    private readonly RobocodeContext _context;

    public LevelService(RobocodeContext context)
    {
        _context = context;
    }

    public async Task<List<LevelResponse>> GetAllLevelsAsync()
    {
        var levels = await _context.Levels
            .Include(l => l.Difficulty)
            .Include(l => l.LevelStatus)
            .OrderBy(l => l.LevelId)
            .ToListAsync();

        return levels.Select(MapToResponse).ToList();
    }

    public async Task<LevelResponse?> GetLevelByIdAsync(int levelId)
    {
        var level = await _context.Levels
            .Include(l => l.Difficulty)
            .Include(l => l.LevelStatus)
            .FirstOrDefaultAsync(l => l.LevelId == levelId);

        return level == null ? null : MapToResponse(level);
    }

    public async Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request)
    {
        var difficultyExists = await _context.Difficulties
            .AnyAsync(d => d.DifficultyId == request.DifficultyId);
        if (!difficultyExists)
            throw new ArgumentException($"Сложность с ID {request.DifficultyId} не найдена");

        var statusExists = await _context.LevelStatuses
            .AnyAsync(s => s.LevelStatusId == request.LevelStatusId);
        if (!statusExists)
            throw new ArgumentException($"Статус уровня с ID {request.LevelStatusId} не найден");

        if (request.MapData == null)
            throw new ArgumentException("MapData обязателен");

        string mapDataJson = JsonSerializer.Serialize(request.MapData);

        var level = new Level
        {
            MapData = mapDataJson,
            DifficultyId = request.DifficultyId,
            LevelStatusId = request.LevelStatusId,
            Created = DateTime.UtcNow
        };

        _context.Levels.Add(level);
        await _context.SaveChangesAsync();

        await _context.Entry(level).Reference(l => l.Difficulty).LoadAsync();
        await _context.Entry(level).Reference(l => l.LevelStatus).LoadAsync();

        return MapToResponse(level);
    }

    private static LevelResponse MapToResponse(Level level)
    {
        object? mapDataObj = null;
        string? levelName = null;
        string? description = null;
        int? width = null;
        int? height = null;

        if (!string.IsNullOrWhiteSpace(level.MapData))
        {
            try
            {
                using var doc = JsonDocument.Parse(level.MapData);
                mapDataObj = JsonSerializer.Deserialize<object>(level.MapData);

                var root = doc.RootElement;
                if (root.TryGetProperty("level_name", out var nameProp))
                    levelName = nameProp.GetString();
                if (root.TryGetProperty("description", out var descProp))
                    description = descProp.GetString();
                if (root.TryGetProperty("width", out var wProp) && wProp.TryGetInt32(out var w))
                    width = w;
                if (root.TryGetProperty("height", out var hProp) && hProp.TryGetInt32(out var h))
                    height = h;
            }
            catch
            {
                // Если JSON битый, просто оставляем null
            }
        }

        return new LevelResponse
        {
            LevelId = level.LevelId,
            MapData = mapDataObj,
            LevelName = levelName ?? $"Уровень {level.LevelId}",
            Description = description,
            Width = width,
            Height = height,
            DifficultyId = level.DifficultyId,
            DifficultyName = MapDifficulty(level.Difficulty?.Name),
            LevelStatusId = level.LevelStatusId,
            LevelStatusName = MapStatus(level.LevelStatus?.Name),
            Created = level.Created
        };
    }

    private static string MapDifficulty(string? name) => name?.ToLowerInvariant() switch
    {
        "easy" => "Лёгкий",
        "medium" => "Средний",
        "hard" => "Сложный",
        "expert" => "Эксперт",
        _ => name ?? "Неизвестно"
    };

    private static string MapStatus(string? name) => name?.ToLowerInvariant() switch
    {
        "available" => "Доступен",
        "blocked" => "Заблокирован",
        "hidden" => "Скрыт",
        _ => name ?? "Неизвестно"
    };
}