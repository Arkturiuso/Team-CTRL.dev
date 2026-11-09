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
/// Запуск программы робота. Сессия уровня хранится в БД (run_session), поэтому путь
/// робота, собранные ключи/монеты и накопленные тики переживают перезапуск API.
/// Одновременные run/state/reset одной сессии сериализует SemaphoreSlim-гейт в памяти,
/// а само состояние каждый раз читается и пишется в базу. После успешного запуска
/// сессия помечается completed: state отдаёт вход, следующий запуск начинается с чистого
/// листа. Один запуск = одна попытка; балл считается по тикам и строкам текущего запуска,
/// ключи/монеты в результате - накопленные за прохождение.
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
    private readonly IRunSessionPersistence _persistence;
    private readonly ILevelAccessService _levelAccess;

    public GameRunService(
        RobocodeContext context,
        LevelSessionStore sessions,
        IRunSessionPersistence persistence,
        ILevelAccessService levelAccess)
    {
        _context = context;
        _sessions = sessions;
        _persistence = persistence;
        _levelAccess = levelAccess;
    }

    public async Task<RunResultDto> RunAsync(int userId, bool isAdmin, RunCodeRequest request)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, request.LevelId);
        // preview - режим показа: прогон без записи попытки. Отдельная сессия - только у админа.
        var preview = request.Preview && isAdmin;
        var linesCount = Lexer.CountCodeLines(request.Code);

        var gate = _sessions.GetGate(userId, request.LevelId, preview);
        await gate.WaitAsync();
        try
        {
            // Состояние всегда загружается из БД: путь переживает рестарт процесса.
            // Завершённая сессия приходит чистым симулятором (вход, пустой лут, тики 0).
            var stored = await _persistence.LoadAsync(userId, request.LevelId, preview, runtime.Map);
            var simulator = stored.Simulator;
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

            try
            {
                SimulationResult result;
                try
                {
                    result = Execute(runtime, simulator, request.Code);
                }
                catch (Exception error)
                {
                    // Execute уже ловит ошибки; страховка, чтобы сессия сохранилась и при сбое.
                    simulator.RecordError($"Ошибка выполнения: {error.Message}", null);
                    result = simulator.Finish($"Ошибка выполнения: {error.Message}", null);
                }

                // EndState фиксируется до сохранения в БД и до возможного сброса на успехе.
                var endState = BuildState(simulator);

                // Тики/строки - только текущего запуска: счётчик тиков симулятора накопленный
                // и восстановлен из сессии, поэтому вычитаем тики на старте запуска.
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
                        await PersistBestResultAsync(userId, request.LevelId, attempt.AttemptId, result, runTicks, score);
                }

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
                // Сохраняем после КАЖДОГО прогона, включая ошибку и крушение:
                // следующий запуск продолжит с последней клетки. Успех закрывает сессию.
                await _persistence.SaveAsync(
                    userId, request.LevelId, preview, simulator,
                    completed: simulator.Finished && simulator.Success);
            }
        }
        finally
        {
            gate.Release();
        }
    }

    /// <summary>Текущее состояние робота на уровне. Завершённая сессия отдаёт состояние входа.</summary>
    public async Task<RunStartStateDto> GetStateAsync(int userId, bool isAdmin, int levelId, bool preview = false)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, levelId);
        var previewSession = preview && isAdmin;
        var gate = _sessions.GetGate(userId, levelId, previewSession);
        await gate.WaitAsync();
        try
        {
            // completed-сессия приходит чистым симулятором: state показывает вход.
            var stored = await _persistence.LoadAsync(userId, levelId, previewSession, runtime.Map);
            return BuildState(stored.Simulator);
        }
        finally
        {
            gate.Release();
        }
    }

    /// <summary>Сброс прохождения: робот на входе, ключи и монеты возвращаются, тики 0.</summary>
    public async Task<RunStartStateDto> ResetAsync(int userId, bool isAdmin, int levelId, bool preview = false)
    {
        var runtime = await LoadRuntimeAsync(userId, isAdmin, levelId);
        var previewSession = preview && isAdmin;
        var gate = _sessions.GetGate(userId, levelId, previewSession);
        await gate.WaitAsync();
        try
        {
            // Строка сессии стирается: следующий state/run начнётся со входа.
            await _persistence.DeleteAsync(userId, levelId, previewSession);
            return BuildState(new LevelSimulator(runtime.Map));
        }
        finally
        {
            gate.Release();
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
    /// Тики пишутся только текущего запуска (runTicks), а не накопленные симулятором.
    /// </summary>
    private async Task PersistBestResultAsync(int userId, int levelId, int attemptId, SimulationResult result, int runTicks, int score)
    {
        var existing = await _context.Results
            .FirstOrDefaultAsync(r => r.UserId == userId && r.LevelId == levelId);

        if (existing == null)
        {
            _context.Results.Add(new Result
            {
                UserId = userId,
                LevelId = levelId,
                TickCount = runTicks,
                KeysCollected = result.KeysCollected,
                TotalScore = score,
                Fixed = DateTime.UtcNow,
                AttemptId = attemptId
            });
        }
        else if (score > existing.TotalScore)
        {
            existing.TotalScore = score;
            existing.TickCount = runTicks;
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
