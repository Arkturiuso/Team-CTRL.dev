using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core.Game;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;

namespace Server_RoboCode.Services;

/// <summary>Загруженная из БД сессия: симулятор с накопленным состоянием и признак завершения.</summary>
public sealed record StoredRunSession(LevelSimulator Simulator, bool Completed);

public interface IRunSessionPersistence
{
    /// <summary>Читает сессию уровня; при отсутствии/порче строки отдаёт чистый старт.</summary>
    Task<StoredRunSession> LoadAsync(int userId, int levelId, bool preview, GameMap map);

    /// <summary>Перезаписывает строку сессии после прогона (включая ошибку/крушение).</summary>
    Task SaveAsync(int userId, int levelId, bool preview, LevelSimulator simulator, bool completed);

    /// <summary>Стирает строку сессии: сброс прохождения к состоянию входа.</summary>
    Task DeleteAsync(int userId, int levelId, bool preview);
}

/// <summary>
/// Хранение сессии прогона в таблице run_session: последняя клетка и направление,
/// собранные ключи/монеты (JSON-массивы клеток), накопленные тики и completed.
/// Строка одна на (игрок, уровень, preview) и переживает перезапуск API.
/// </summary>
public sealed class RunSessionPersistence : IRunSessionPersistence
{
    private readonly RobocodeContext _context;

    public RunSessionPersistence(RobocodeContext context) => _context = context;

    public async Task<StoredRunSession> LoadAsync(int userId, int levelId, bool preview, GameMap map)
    {
        var row = await FindAsync(userId, levelId, preview);
        if (row == null)
            return new StoredRunSession(new LevelSimulator(map), false);

        // Успешное прохождение закрыто: state отдаёт вход, следующий запуск - с чистого листа.
        if (row.Completed)
            return new StoredRunSession(new LevelSimulator(map), true);

        if (TryReadCells(row.CollectedKeys, out var keyCells)
            && TryReadCells(row.CollectedCoins, out var coinCells))
        {
            var snapshot = new SimulatorSnapshot
            {
                Position = new Pos(row.RobotX, row.RobotY),
                Direction = row.Direction,
                CollectedKeyCells = keyCells,
                CollectedCoinCells = coinCells
            };

            var simulator = new LevelSimulator(map);
            if (simulator.TryRestore(snapshot, row.Ticks))
                return new StoredRunSession(simulator, false);
        }

        // Карта изменилась или строка повреждена: откат на вход и пустой лут, мусор стираем.
        await DeleteRowAsync(row);
        return new StoredRunSession(new LevelSimulator(map), false);
    }

    public async Task SaveAsync(int userId, int levelId, bool preview, LevelSimulator simulator, bool completed)
    {
        var snapshot = simulator.Snapshot();
        var row = await FindAsync(userId, levelId, preview);
        if (row == null)
        {
            row = new RunSession { UserId = userId, LevelId = levelId, Preview = preview };
            _context.RunSessions.Add(row);
        }

        row.RobotX = snapshot.Position.X;
        row.RobotY = snapshot.Position.Y;
        row.Direction = snapshot.Direction;
        row.CollectedKeys = JsonSerializer.Serialize(snapshot.CollectedKeyCells);
        row.CollectedCoins = JsonSerializer.Serialize(snapshot.CollectedCoinCells);
        row.Ticks = simulator.Ticks;
        row.Completed = completed;
        row.Updated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int levelId, bool preview)
    {
        var row = await FindAsync(userId, levelId, preview);
        if (row != null)
            await DeleteRowAsync(row);
    }

    private async Task DeleteRowAsync(RunSession row)
    {
        _context.RunSessions.Remove(row);
        await _context.SaveChangesAsync();
    }

    private Task<RunSession?> FindAsync(int userId, int levelId, bool preview)
        => _context.RunSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.LevelId == levelId && s.Preview == preview);

    /// <summary>JSON-массив клеток; битый JSON считается повреждением сессии.</summary>
    private static bool TryReadCells(string? json, out List<string> cells)
    {
        cells = new List<string>();
        if (string.IsNullOrWhiteSpace(json)) return true;

        try
        {
            var parsed = JsonSerializer.Deserialize<List<string>>(json);
            if (parsed != null)
                cells = parsed.Where(cell => !string.IsNullOrWhiteSpace(cell)).ToList();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
