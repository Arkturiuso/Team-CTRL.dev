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
    Task<RunStartStateDto> GetStateAsync(int userId, bool isAdmin, int levelId, bool preview = false);
    Task<RunStartStateDto> ResetAsync(int userId, bool isAdmin, int levelId, bool preview = false);
}

/// <summary>
/// Запуск программы робота: сессия уровня живёт в памяти и переиспользует симулятор
/// между запусками, поэтому позиция, направление, собранные ключи и монеты сохраняются.
/// После успешного запуска сессия помечается completed и следующий запуск начинается
/// со входа (новый симулятор). Один запуск = одна попытка; балл считается по тикам и
/// строкам текущего запуска, ключи/монеты в результате - накопленные за прохождение.
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
    private readonly LevelSessionStore _sessions;
    private readonly ILevelAccessService _levelAccess;

    public GameRunService(RobocodeContext context, LevelSessionStore sessions, ILevelAccessService levelAccess)
    {
        _context = context;
        _sessions = sessions;
        _levelAccess = levelAccess;
    }

    public async Task<RunResultDto> RunAsync(int userId, bool isAdmin, RunCodeRequest request)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, request.LevelId);
        // preview - режим показа: прогон без записи в базу. Отдельная сессия - только у админа.
        var preview = request.Preview;
        var linesCount = Lexer.CountCodeLines(request.Code);

        var session = _sessions.Get(userId, request.LevelId, preview && isAdmin, () => new LevelSimulator(runtime.Map));

        await session.Gate.WaitAsync();
        try
        {
            // Прошлое прохождение успешно завершено - новый запуск идёт с входа.
            if (session.Completed)
                session.Restart(new LevelSimulator(runtime.Map));

            var simulator = session.Simulator;
            simulator.BeginRun();
            var startTicks = simulator.Ticks;
            var startState = BuildState(simulator);

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

            var result = Execute(runtime, simulator, request.Code);
            // EndState фиксируется до возможного пересоздания симулятора при успехе.
            var endState = BuildState(simulator);

            // Тики/строки - только текущего запуска: симулятор живёт между запусками,
            // его счётчик тиков накопленный. Ключи/монеты в результате накопленные.
            var runTicks = Math.Max(0, result.Ticks - startTicks);

            var score = result.Success
                ? Math.Max(0, runtime.DifficultyScale * ScoreBasePerDifficulty
                            - ScorePenaltyPerTick * runTicks
                            - ScorePenaltyPerLine * linesCount)
                : 0;

            if (attempt != null)
            {
                attempt.AttemptStatusId = result.Success ? 2 : 3;
                attempt.TickCount = runTicks;
                attempt.LinesCount = linesCount;
                attempt.ErrorMessage = result.Success ? null : result.ErrorMessage;
                await _context.SaveChangesAsync();

                if (result.Success)
                    await PersistBestResultAsync(userId, request.LevelId, attempt.AttemptId, result, score);
            }

            // Успех закрывает текущее прохождение: следующий запуск начнётся со входа.
            if (result.Success)
                session.Completed = true;

            return new RunResultDto
            {
                AttemptId = attempt?.AttemptId,
                Status = result.Success ? "success" : "error",
                Success = result.Success,
                Ticks = runTicks,
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
                StartState = startState,
                EndState = endState,
                Frames = result.Frames.Select(frame => new GameFrameDto
                {
                    Tick = frame.Tick - startTicks,
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
        finally
        {
            session.Gate.Release();
        }
    }

    /// <summary>Текущее состояние робота на уровне. Завершённая сессия отдаёт состояние входа.</summary>
    public async Task<RunStartStateDto> GetStateAsync(int userId, bool isAdmin, int levelId, bool preview = false)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, levelId);
        var session = _sessions.Get(userId, levelId, preview && isAdmin, () => new LevelSimulator(runtime.Map));

        await session.Gate.WaitAsync();
        try
        {
            if (session.Completed)
                session.Restart(new LevelSimulator(runtime.Map));

            return BuildState(session.Simulator);
        }
        finally
        {
            session.Gate.Release();
        }
    }

    /// <summary>Сброс прохождения: робот на входе, ключи и монеты возвращаются.</summary>
    public async Task<RunStartStateDto> ResetAsync(int userId, bool isAdmin, int levelId, bool preview = false)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, levelId);
        var session = _sessions.Get(userId, levelId, preview && isAdmin, () => new LevelSimulator(runtime.Map));

        await session.Gate.WaitAsync();
        try
        {
            session.Restart(new LevelSimulator(runtime.Map));
            return BuildState(session.Simulator);
        }
        finally
        {
            session.Gate.Release();
        }
    }

    private static RunStartStateDto BuildState(LevelSimulator simulator)
    {
        var snapshot = simulator.Snapshot();
        return new RunStartStateDto
        {
            Robot = new FrameRobotDto
            {
                Cell = snapshot.Position.Name,
                Direction = snapshot.Direction
            },
            KeysCollected = simulator.KeysCollected,
            KeysTotal = simulator.KeysTotal,
            CoinsCollected = simulator.CoinsCollected,
            CoinsTotal = simulator.CoinsTotal,
            CollectedCoinCells = snapshot.CollectedCoinCells
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

        // Последовательная блокировка: предыдущий уровень должен быть пройден.
        if (!isAdmin)
            await _levelAccess.EnsureUnlockedAsync(userId, levelId);

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

    private static SimulationResult Execute(LevelRuntime runtime, LevelSimulator simulator, string? code)
    {
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
