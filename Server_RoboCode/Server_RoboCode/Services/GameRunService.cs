using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core.Game;
using Server_RoboCode.Core.Scripting;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

public interface IGameRunService
{
    Task<RunResultDto> RunAsync(int userId, bool isAdmin, RunCodeRequest request);
}

/// <summary>
/// Запуск программы робота по эталону: один запуск = один полный прогон лабиринта
/// с входа, состояние между запусками не хранится. Фиксирует попытку, при успехе
/// считает балл и обновляет лучший результат и статистику игрока.
/// </summary>
public sealed class GameRunService : IGameRunService
{
    // Формула балла эталона: score = max(0, BASE - K_TICKS * ticks - K_LINES * linesCount).
    // BASE = 100 * шкала сложности из справочника difficulty (easy=1 ... expert=4),
    // так баллы лежат в внятных границах: 58-400 в зависимости от уровня и решения.
    private const int ScoreBasePerDifficulty = 100;
    private const int ScorePenaltyPerTick = 2;
    private const int ScorePenaltyPerLine = 5;

    private readonly RobocodeContext _context;

    public GameRunService(RobocodeContext context) => _context = context;

    public async Task<RunResultDto> RunAsync(int userId, bool isAdmin, RunCodeRequest request)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, request.LevelId);
        // preview - режим показа: любой прогон без записи в базу, роль на это не влияет
        var preview = request.Preview;
        var linesCount = Lexer.CountCodeLines(request.Code);

        // Attempt status 1 = "in_progress": попытка пишется в базе до выполнения программы.
        Attempt? attempt = null;
        if (!preview)
        {
            attempt = new Attempt
            {
                UserId = userId,
                LevelId = request.LevelId,
                SourceCode = request.Code ?? string.Empty,
                Submitted = DateTime.UtcNow,
                AttemptStatusId = 1,
                TickCount = 0,
                LinesCount = null
            };
            _context.Attempts.Add(attempt);
            await _context.SaveChangesAsync();
        }

        var result = Execute(runtime, request.Code);
        var score = result.Success
            ? Math.Max(0, runtime.DifficultyScale * ScoreBasePerDifficulty
                        - ScorePenaltyPerTick * result.Ticks
                        - ScorePenaltyPerLine * linesCount)
            : 0;

        if (attempt != null)
        {
            attempt.AttemptStatusId = result.Success ? 2 : 3;
            attempt.TickCount = result.Ticks;
            attempt.LinesCount = linesCount;
            attempt.ErrorMessage = result.Success ? null : result.ErrorMessage;
            await _context.SaveChangesAsync();

            if (result.Success)
                await PersistBestResultAsync(userId, request.LevelId, attempt.AttemptId, result, score);
        }

        return new RunResultDto
        {
            AttemptId = attempt?.AttemptId,
            Status = result.Success ? "success" : "error",
            Success = result.Success,
            Ticks = result.Ticks,
            LinesCount = linesCount,
            KeysCollected = result.KeysCollected,
            KeysTotal = result.KeysTotal,
            CoinsCollected = result.CoinsCollected,
            CoinsTotal = result.CoinsTotal,
            Score = score,
            Difficulty = runtime.DifficultyName,
            ErrorMessage = result.ErrorMessage,
            ErrorLine = result.ErrorLine,
            FinalRobot = new FrameRobotDto
            {
                Cell = new Pos(result.RobotX, result.RobotY).Name,
                Direction = result.RobotDirection
            },
            Frames = result.Frames.Select(frame => new GameFrameDto
            {
                Tick = frame.Tick,
                Robot = new FrameRobotDto
                {
                    Cell = new Pos(frame.X, frame.Y).Name,
                    Direction = frame.Direction
                },
                CodeLine = frame.CodeLine,
                KeyTaken = frame.KeyTaken,
                CoinTaken = frame.CoinTaken,
                AtExit = frame.AtExit,
                Crashed = frame.Crashed
            }).ToList(),
            // вывод print() и ошибки консоли идут во фронт как есть, по порядку исполнения
            Console = result.Console.Select(c => new RunConsoleEntryDto
            {
                Line = c.Line,
                Text = c.Text,
                Kind = c.Kind
            }).ToList()
        };
    }

    private async Task<LevelRuntime> LoadRuntimeAsync(int userId, bool isAdmin, int levelId)
    {
        var level = await _context.Levels
            .Include(l => l.Difficulty)
            .Include(l => l.LevelCommands).ThenInclude(lc => lc.Command)
            .FirstOrDefaultAsync(l => l.LevelId == levelId);

        if (level == null)
            throw new ArgumentException($"Уровень {levelId} не найден");

        // Статус уровня авторитетен на сервере: игроку закрыты не-доступные уровни.
        if (!isAdmin && level.LevelStatusId != 1)
            throw new ArgumentException("Уровень недоступен для прохождения");

        GameMap map;
        try
        {
            map = GameMap.Parse(level.MapData);
        }
        catch (Exception error)
        {
            throw new ArgumentException($"Карта уровня повреждена: {error.Message}");
        }

        var allowed = level.LevelCommands
            .Select(lc => lc.Command?.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .ToList();

        var learned = await _context.KnowledgeBases
            .Where(kb => kb.UserId == userId)
            .Select(kb => kb.Command.Name)
            .ToListAsync();

        allowed = allowed
            .Concat(learned.Where(name => !string.IsNullOrWhiteSpace(name)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new LevelRuntime(levelId, map, allowed, level.Difficulty?.Name ?? "unknown", level.DifficultyId);
    }

    private static SimulationResult Execute(LevelRuntime runtime, string? code)
    {
        var simulator = new LevelSimulator(runtime.Map);
        simulator.BeginRun();

        try
        {
            var tokens = new Lexer(code ?? string.Empty).Tokenize();
            var program = new Parser(tokens).ParseProgram();
            var interpreter = new Interpreter(simulator, runtime.AllowedCommands);
            return interpreter.Run(program);
        }
        catch (ScriptError error)
        {
            simulator.RecordError(error.Message, error.Line);
            return simulator.Finish(error.Message, error.Line);
        }
        catch (RobotCrashedException error)
        {
            return simulator.Finish(error.Message, error.Line, crashed: true);
        }
        catch (Exception error)
        {
            simulator.RecordError($"Ошибка разбора программы: {error.Message}", null);
            return simulator.Finish($"Ошибка разбора программы: {error.Message}", null);
        }
    }

    /// <summary>
    /// Лучший результат сравнивается строго по баллу (не по звёздам):
    /// перезапись только при score выше текущего - фиксированный бад с перезаписью при равенстве.
    /// </summary>
    private async Task PersistBestResultAsync(int userId, int levelId, int attemptId, SimulationResult result, int score)
    {
        var existing = await _context.Results
            .FirstOrDefaultAsync(r => r.UserId == userId && r.LevelId == levelId);

        if (existing == null)
        {
            _context.Results.Add(new Result
            {
                UserId = userId,
                LevelId = levelId,
                TickCount = result.Ticks,
                KeysCollected = result.KeysCollected,
                TotalScore = score,
                Fixed = DateTime.UtcNow,
                AttemptId = attemptId
            });
        }
        else if (score > existing.TotalScore)
        {
            existing.TotalScore = score;
            existing.TickCount = result.Ticks;
            existing.KeysCollected = result.KeysCollected;
            existing.AttemptId = attemptId;
            existing.Fixed = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var levelCommandIds = await _context.LevelCommands
            .Where(lc => lc.LevelId == levelId)
            .Select(lc => lc.CommandId)
            .ToListAsync();

        var already = await _context.KnowledgeBases
            .Where(kb => kb.UserId == userId && levelCommandIds.Contains(kb.CommandId))
            .Select(kb => kb.CommandId)
            .ToListAsync();

        foreach (var cmdId in levelCommandIds.Except(already))
            _context.KnowledgeBases.Add(new KnowledgeBase { UserId = userId, CommandId = cmdId });

        await _context.SaveChangesAsync();

        // Ограничение эталона: при улучшении лучшего результата суммарный балл
        // игрока пересчитывается автоматически.
        var stats = await _context.PlayerStatistics.FirstOrDefaultAsync(s => s.UserId == userId);
        if (stats != null)
        {
            stats.LevelsPassed = await _context.Results.CountAsync(r => r.UserId == userId);
            stats.TotalScore = await _context.Results
                .Where(r => r.UserId == userId)
                .SumAsync(r => r.TotalScore);
            stats.LastUpdate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private sealed record LevelRuntime(int LevelId, GameMap Map, List<string> AllowedCommands, string DifficultyName, int DifficultyScale);
}
