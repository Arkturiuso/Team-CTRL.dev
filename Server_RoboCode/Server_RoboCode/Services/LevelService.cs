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

    public async Task<List<LevelResponse>> GetAllLevelsAsync(int? userId = null)
    {
        // Загружаем уровни с необходимыми связями
        var levels = await _context.Levels
            .Include(l => l.Difficulty)
            .Include(l => l.LevelStatus)
            .Include(l => l.LevelCommands)
                .ThenInclude(lc => lc.Command)
            .OrderBy(l => l.LevelId)
            .ToListAsync();

        Dictionary<int, int> starsByLevel = new();
        List<Command> kbCommands = new();

        // Если пользователь авторизован, получаем его прогресс
        if (userId.HasValue)
        {
            starsByLevel = await _context.Results
                .Where(r => r.UserId == userId.Value)
                .ToDictionaryAsync(r => r.LevelId, r => ClampStars(r.TotalScore));

            kbCommands = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId.Value)
                .Select(kb => kb.Command)
                .Distinct()
                .ToListAsync();
        }

        return levels.Select(level =>
        {
            var response = MapToResponse(level);
            response.UserStars = starsByLevel.TryGetValue(level.LevelId, out var stars) ? stars : 0;
            FillCommands(response, level, kbCommands);
            return response;
        }).ToList();
    }

    public async Task<LevelResponse?> GetLevelByIdAsync(int levelId, int? userId = null)
    {
        var level = await _context.Levels
            .Include(l => l.Difficulty)
            .Include(l => l.LevelStatus)
            .Include(l => l.LevelCommands)
                .ThenInclude(lc => lc.Command)
            .FirstOrDefaultAsync(l => l.LevelId == levelId);

        if (level == null) return null;

        var response = MapToResponse(level);
        response.UserStars = 0;

        List<Command> kbCommands = new();

        if (userId.HasValue)
        {
            var result = await _context.Results
                .FirstOrDefaultAsync(r => r.UserId == userId.Value && r.LevelId == levelId);

            if (result != null)
            {
                response.UserStars = ClampStars(result.TotalScore);
            }

            kbCommands = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId.Value)
                .Select(kb => kb.Command)
                .Distinct()
                .ToListAsync();
        }

        FillCommands(response, level, kbCommands);
        return response;
    }

    public async Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request)
    {
        var difficultyExists = await _context.Difficulties.AnyAsync(d => d.DifficultyId == request.DifficultyId);
        if (!difficultyExists)
            throw new ArgumentException($"Сложность с ID {request.DifficultyId} не найдена");

        var statusExists = await _context.LevelStatuses.AnyAsync(s => s.LevelStatusId == request.LevelStatusId);
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

        var response = MapToResponse(level);
        response.NewCommands = new List<CommandDto>();
        response.AllowedCommands = new List<CommandDto>();
        return response;
    }

    private static int ClampStars(int score) => Math.Clamp(score, 0, 3);

    private static void FillCommands(LevelResponse response, Level level, List<Command> kbCommands)
    {
        var levelCmds = level.LevelCommands?
            .Select(lc => lc.Command)
            .Where(c => c != null)
            .Cast<Command>()
            .ToList() ?? new List<Command>();

        response.NewCommands = levelCmds.Select(ToCommandDto).ToList();

        response.AllowedCommands = levelCmds
            .Concat(kbCommands)
            .GroupBy(c => c.CommandId)
            .Select(g => ToCommandDto(g.First()))
            .ToList();
    }

    private static CommandDto ToCommandDto(Command c) => new()
    {
        CommandId = c.CommandId,
        Name = c.Name,
        Syntax = c.Syntax,
        Description = c.Description
    };

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
                // Если JSON невалидный, оставляем null, фронтенд обработает это gracefully
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
            Created = level.Created,
            AllowedCommands = new List<CommandDto>(),
            NewCommands = new List<CommandDto>()
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