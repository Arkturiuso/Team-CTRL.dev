using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;
using System.Text.Json;

namespace Server_RoboCode.Services;

public class LevelService : ILevelService
{
    private readonly RobocodeContext _context;

    public LevelService(RobocodeContext context) => _context = context;

    public async Task<List<LevelResponse>> GetAllLevelsAsync(int? userId = null, bool isAdmin = false)
    {
        var query = _context.Levels
            .Include(l => l.Difficulty).Include(l => l.LevelStatus)
            .Include(l => l.LevelCommands).ThenInclude(lc => lc.Command)
            .AsQueryable();

        // Игроку не отдаём "скрыт" и "заблокирован": статус уровня авторитетен на сервере.
        if (!isAdmin) query = query.Where(l => l.LevelStatusId == 1);

        var levels = await query.OrderBy(l => l.LevelId).ToListAsync();

        Dictionary<int, int> bestScoreByLevel = new();
        List<Command> kbCommands = new();

        if (userId.HasValue)
        {
            bestScoreByLevel = await _context.Results
                .Where(r => r.UserId == userId.Value)
                .ToDictionaryAsync(r => r.LevelId, r => r.TotalScore);
            kbCommands = await _context.KnowledgeBases.Where(kb => kb.UserId == userId.Value).Select(kb => kb.Command).Distinct().ToListAsync();
        }

        return levels.Select(level =>
        {
            var response = MapToResponse(level);
            response.UserBestScore = bestScoreByLevel.TryGetValue(level.LevelId, out var score) ? score : 0;
            FillCommands(response, level, kbCommands);
            return response;
        }).ToList();
    }

    public async Task<LevelResponse?> GetLevelByIdAsync(int levelId, int? userId = null, bool isAdmin = false)
    {
        var level = await _context.Levels.Include(l => l.Difficulty).Include(l => l.LevelStatus)
            .Include(l => l.LevelCommands).ThenInclude(lc => lc.Command).FirstOrDefaultAsync(l => l.LevelId == levelId);

        if (level == null) return null;
        if (!isAdmin && level.LevelStatusId != 1) return null;

        var response = MapToResponse(level);

        List<Command> kbCommands = new();

        if (userId.HasValue)
        {
            var result = await _context.Results.FirstOrDefaultAsync(r => r.UserId == userId.Value && r.LevelId == levelId);
            if (result != null) response.UserBestScore = result.TotalScore;
            response.UserAttempts = await _context.Attempts.CountAsync(a => a.UserId == userId.Value && a.LevelId == levelId);
            kbCommands = await _context.KnowledgeBases.Where(kb => kb.UserId == userId.Value).Select(kb => kb.Command).Distinct().ToListAsync();
        }

        FillCommands(response, level, kbCommands);
        return response;
    }

    public async Task<LevelResponse> CreateLevelAsync(CreateLevelRequest request)
    {
        if (!await _context.Difficulties.AnyAsync(d => d.DifficultyId == request.DifficultyId))
            throw new ArgumentException($"Сложность с ID {request.DifficultyId} не найдена");

        if (!await _context.LevelStatuses.AnyAsync(s => s.LevelStatusId == request.LevelStatusId))
            throw new ArgumentException($"Статус уровня с ID {request.LevelStatusId} не найден");

        if (request.MapData == null) throw new ArgumentException("MapData обязателен");

        var mapJson = JsonSerializer.Serialize(request.MapData);
        var level = new Level
        {
            MapData = mapJson,
            DifficultyId = request.DifficultyId,
            LevelStatusId = request.LevelStatusId,
            KeysCount = CountKeys(mapJson),
            CoinsCount = CountCoins(mapJson),
            Created = DateTime.UtcNow
        };

        _context.Levels.Add(level);
        await _context.SaveChangesAsync();

        // Сохраняем выбранные команды для уровня
        if (request.CommandIds != null && request.CommandIds.Count > 0)
        {
            foreach (var commandId in request.CommandIds)
            {
                if (await _context.Commands.AnyAsync(c => c.CommandId == commandId))
                    _context.LevelCommands.Add(new LevelCommand { LevelId = level.LevelId, CommandId = commandId });
            }
            await _context.SaveChangesAsync();
        }

        await _context.Entry(level).Reference(l => l.Difficulty).LoadAsync();
        await _context.Entry(level).Reference(l => l.LevelStatus).LoadAsync();

        var response = MapToResponse(level);
        response.NewCommands = new List<CommandDto>();
        response.AllowedCommands = new List<CommandDto>();
        return response;
    }

    private static void FillCommands(LevelResponse response, Level level, List<Command> kbCommands)
    {
        var levelCmds = level.LevelCommands?.Select(lc => lc.Command).Where(c => c != null).Cast<Command>().ToList() ?? new List<Command>();
        response.NewCommands = levelCmds.Select(c => new CommandDto { CommandId = c.CommandId, Name = c.Name, Syntax = c.Syntax, Description = c.Description }).ToList();
        response.AllowedCommands = levelCmds.Concat(kbCommands).GroupBy(c => c.CommandId).Select(g => new CommandDto { CommandId = g.First().CommandId, Name = g.First().Name, Syntax = g.First().Syntax, Description = g.First().Description }).ToList();
    }

    private static LevelResponse MapToResponse(Level level)
    {
        object? mapDataObj = null; string? levelName = null; string? description = null; int? width = null; int? height = null; int? mapKeys = null; int? mapCoins = null;

        if (!string.IsNullOrWhiteSpace(level.MapData))
        {
            try
            {
                using var doc = JsonDocument.Parse(level.MapData);
                mapDataObj = JsonSerializer.Deserialize<object>(level.MapData);
                var root = doc.RootElement;
                if (root.TryGetProperty("level_name", out var nameProp)) levelName = nameProp.GetString();
                if (root.TryGetProperty("description", out var descProp)) description = descProp.GetString();
                if (root.TryGetProperty("width", out var wProp) && wProp.TryGetInt32(out var w)) width = w;
                if (root.TryGetProperty("height", out var hProp) && hProp.TryGetInt32(out var h)) height = h;
                if (root.TryGetProperty("keys", out var keysProp) && keysProp.ValueKind == JsonValueKind.Array) mapKeys = keysProp.GetArrayLength();
                if (root.TryGetProperty("coins", out var coinsProp) && coinsProp.ValueKind == JsonValueKind.Array) mapCoins = coinsProp.GetArrayLength();
            }
            catch { }
        }

        string MapDifficulty(string? n) => n?.ToLowerInvariant() switch { "easy" => "лёгкий", "medium" => "средний", "hard" => "сложный", "expert" => "эксперт", _ => n ?? "неизвестно" };
        string MapStatus(string? n) => n?.ToLowerInvariant() switch { "available" => "доступен", "blocked" => "заблокирован", "hidden" => "скрыт", _ => n ?? "неизвестно" };

        return new LevelResponse
        {
            LevelId = level.LevelId,
            MapData = mapDataObj,
            LevelName = levelName ?? $"Уровень {level.LevelId}",
            Description = description,
            Width = width,
            Height = height,
            // Эталонный атрибут уровня: колонка keys_count, на всякий случай сверяется с массивом keys.
            KeysCount = level.KeysCount > 0 ? level.KeysCount : mapKeys ?? 0,
            // Монеты: колонка coins_count с fallback на массив coins в map_data.
            CoinsCount = level.CoinsCount > 0 ? level.CoinsCount : mapCoins ?? 0,
            DifficultyId = level.DifficultyId,
            DifficultyName = MapDifficulty(level.Difficulty?.Name),
            LevelStatusId = level.LevelStatusId,
            LevelStatusName = MapStatus(level.LevelStatus?.Name),
            Created = level.Created,
            AllowedCommands = new List<CommandDto>(),
            NewCommands = new List<CommandDto>()
        };
    }

    private static int CountKeys(string mapJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(mapJson);
            if (doc.RootElement.TryGetProperty("keys", out var keys) && keys.ValueKind == JsonValueKind.Array)
                return keys.GetArrayLength();
        }
        catch { }

        return 0;
    }

    /// <summary>Считает монеты в map_data: элемент - строка "B3" или объект {position:"B3"}.</summary>
    private static int CountCoins(string mapJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(mapJson);
            if (!doc.RootElement.TryGetProperty("coins", out var coins) || coins.ValueKind != JsonValueKind.Array)
                return 0;

            var count = 0;
            foreach (var coin in coins.EnumerateArray())
            {
                if (coin.ValueKind == JsonValueKind.String) count++;
                else if (coin.ValueKind == JsonValueKind.Object
                         && coin.TryGetProperty("position", out var position)
                         && position.ValueKind == JsonValueKind.String) count++;
            }

            return count;
        }
        catch { }

        return 0;
    }
}
