using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core.Game;
using Server_RoboCode.Core.Scripting;
using Server_RoboCode.Models;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;

namespace Server_RoboCode.Services;

public interface IGameRunService
{
    Task<RunResponseDto> RunAsync(int userId, bool adminPreview, RunCodeRequest request);
    Task<SessionStateDto> GetStateAsync(int userId, int levelId);
    Task<SessionStateDto> ResetAsync(int userId, int levelId);
}

/// <summary>
/// Запускает код на сервере, сохраняя состояние робота между запусками.
/// Один запуск - один тик: тики и монеты влияют только на звёзды.
/// </summary>
public sealed class GameRunService : IGameRunService
{
    private readonly RobocodeContext _context;
    private readonly LevelSessionStore _sessions;

    public GameRunService(RobocodeContext context, LevelSessionStore sessions)
    {
        _context = context;
        _sessions = sessions;
    }

    public async Task<RunResponseDto> RunAsync(int userId, bool adminPreview, RunCodeRequest request)
    {
        var runtime = await LoadRuntimeAsync(userId, request.LevelId);

        if (request.Preview && adminPreview)
            return RunPreview(runtime, request.Code);

        var session = _sessions.Get(userId, request.LevelId, () => new LevelSimulator(runtime.Map));
        await session.Gate.WaitAsync();
        try
        {
            if (session.Completed)
                session.Reset(new LevelSimulator(runtime.Map));

            var simulator = session.Simulator;
            simulator.BeginRun();
            var execution = Execute(runtime, simulator, request.Code);

            var priorAttempts = await _context.Attempts
                .CountAsync(a => a.UserId == userId && a.LevelId == request.LevelId);
            var attemptNumber = priorAttempts + 1;
            execution.Stars = FinalStars(execution, attemptNumber, runtime.Map.ThreeStarRuns);

            var (userStars, unlocked) = await PersistAsync(userId, request.LevelId, request.Code, execution);

            if (execution.Success) session.Completed = true;

            return new RunResponseDto
            {
                Execution = execution,
                State = BuildState(runtime, simulator, session.Completed),
                UserStars = userStars,
                AttemptNumber = attemptNumber,
                UnlockedCommands = unlocked
            };
        }
        finally
        {
            session.Gate.Release();
        }
    }

    public async Task<SessionStateDto> GetStateAsync(int userId, int levelId)
    {
        var runtime = await LoadRuntimeAsync(userId, levelId);
        var session = _sessions.Get(userId, levelId, () => new LevelSimulator(runtime.Map));

        await session.Gate.WaitAsync();
        try
        {
            if (session.Completed)
                session.Reset(new LevelSimulator(runtime.Map));

            return BuildState(runtime, session.Simulator, session.Completed);
        }
        finally
        {
            session.Gate.Release();
        }
    }

    public async Task<SessionStateDto> ResetAsync(int userId, int levelId)
    {
        var runtime = await LoadRuntimeAsync(userId, levelId);
        var session = _sessions.Get(userId, levelId, () => new LevelSimulator(runtime.Map));

        await session.Gate.WaitAsync();
        try
        {
            session.Reset(new LevelSimulator(runtime.Map));
            return BuildState(runtime, session.Simulator, false);
        }
        finally
        {
            session.Gate.Release();
        }
    }

    private static RunResponseDto RunPreview(LevelRuntime runtime, string code)
    {
        var simulator = new LevelSimulator(runtime.Map);
        simulator.BeginRun();
        var execution = Execute(runtime, simulator, code);

        return new RunResponseDto
        {
            Execution = execution,
            State = BuildState(runtime, simulator, false),
            UserStars = execution.Stars,
            AttemptNumber = 0
        };
    }

    private static int FinalStars(ExecutionResultDto execution, int attemptNumber, int threeStarRuns)
    {
        if (!execution.Success || execution.Stars <= 0) return 0;
        return attemptNumber <= threeStarRuns ? Math.Min(3, execution.Stars + 1) : execution.Stars;
    }

    private async Task<LevelRuntime> LoadRuntimeAsync(int userId, int levelId)
    {
        var level = await _context.Levels
            .Include(l => l.LevelCommands).ThenInclude(lc => lc.Command)
            .FirstOrDefaultAsync(l => l.LevelId == levelId);

        if (level == null)
            throw new ArgumentException($"Уровень {levelId} не найден");

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

        return new LevelRuntime(levelId, map, allowed);
    }

    private static ExecutionResultDto Execute(LevelRuntime runtime, LevelSimulator simulator, string code)
    {
        SimulationResult result;

        try
        {
            var tokens = new Lexer(code ?? string.Empty).Tokenize();
            var program = new Parser(tokens).ParseProgram();
            var interpreter = new Interpreter(simulator, runtime.AllowedCommands);
            result = interpreter.Run(program);
        }
        catch (ScriptError error)
        {
            simulator.RecordCompileError(error.Message, error.Line);
            result = simulator.Finish(error.Message, error.Line);
        }
        catch (Exception error)
        {
            simulator.RecordCompileError($"Ошибка разбора программы: {error.Message}", null);
            result = simulator.Finish($"Ошибка разбора программы: {error.Message}", null);
        }

        return MapResult(runtime, result);
    }

    private static ExecutionResultDto MapResult(LevelRuntime runtime, SimulationResult result) => new()
    {
        LevelId = runtime.LevelId,
        LevelName = runtime.Map.LevelName,
        Biome = runtime.Map.Biome,
        Hint = runtime.Map.Hint,
        Width = runtime.Map.Width,
        Height = runtime.Map.Height,
        Entrance = runtime.Map.Entrance.Name,
        Exit = runtime.Map.Exit.Name,
        Success = result.Success,
        Status = result.Status,
        ErrorMessage = result.ErrorMessage,
        ErrorLine = result.ErrorLine,
        Stars = result.Stars,
        Ticks = result.Ticks,
        HasKey = result.HasKey,
        AtExit = result.AtExit,
        CollectedCoins = result.CollectedCoins,
        TotalCoins = result.TotalCoins,
        ThreeStarRuns = runtime.Map.ThreeStarRuns,
        Frames = result.Frames.Select(frame => new GameFrameDto
        {
            Tick = frame.Tick,
            Type = frame.Type,
            X = frame.X,
            Y = frame.Y,
            Direction = frame.Direction,
            HasKey = frame.HasKey,
            AtExit = frame.AtExit,
            CollectedCoins = frame.CollectedCoins,
            CollectedKeys = frame.CollectedKeys,
            Enemies = frame.Enemies.Select(enemy => new EnemyFrameDto
            {
                Id = enemy.Id,
                Type = enemy.Type,
                X = enemy.X,
                Y = enemy.Y,
                Alive = enemy.Alive
            }).ToList(),
            Message = frame.Message,
            Line = frame.Line
        }).ToList(),
        Console = result.Console.Select(entry => new ConsoleLineDto
        {
            Line = entry.Line,
            Text = entry.Text,
            Kind = entry.Kind
        }).ToList()
    };

    private static SessionStateDto BuildState(LevelRuntime runtime, LevelSimulator simulator, bool completed) => new()
    {
        LevelId = runtime.LevelId,
        X = simulator.RobotPosition.X,
        Y = simulator.RobotPosition.Y,
        Direction = simulator.FacingName(),
        HasKey = simulator.HasKey,
        AtExit = simulator.RobotPosition == runtime.Map.Exit,
        Ticks = simulator.Ticks,
        CollectedCoins = simulator.CollectedCoins.ToList(),
        CollectedKeys = simulator.CollectedKeyNames.ToList(),
        Enemies = simulator.Enemies.Select(enemy => new EnemyFrameDto
        {
            Id = enemy.Id,
            Type = enemy.Type,
            X = enemy.X,
            Y = enemy.Y,
            Alive = enemy.Alive
        }).ToList(),
        TotalCoins = runtime.Map.Coins.Count,
        Completed = completed
    };

    private async Task<(int UserStars, List<CommandDto> Unlocked)> PersistAsync(
        int userId, int levelId, string? code, ExecutionResultDto execution)
    {
        var success = execution.Success;
        var linesCount = (code ?? string.Empty)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Length;

        var attempt = new Attempt
        {
            UserId = userId,
            LevelId = levelId,
            SourceCode = code ?? string.Empty,
            Submitted = DateTime.UtcNow,
            AttemptStatusId = success ? 2 : 3,
            TickCount = execution.Ticks,
            LinesCount = linesCount,
            ErrorMessage = success ? null : execution.ErrorMessage
        };

        _context.Attempts.Add(attempt);
        await _context.SaveChangesAsync();

        var unlocked = new List<CommandDto>();

        if (success)
        {
            var existing = await _context.Results
                .FirstOrDefaultAsync(r => r.UserId == userId && r.LevelId == levelId);

            if (existing == null)
            {
                _context.Results.Add(new Result
                {
                    UserId = userId,
                    LevelId = levelId,
                    TickCount = execution.Ticks,
                    TotalScore = execution.Stars,
                    Fixed = DateTime.UtcNow,
                    AttemptId = attempt.AttemptId
                });
            }
            else if (execution.Stars >= existing.TotalScore)
            {
                existing.TotalScore = execution.Stars;
                existing.TickCount = execution.Ticks;
                existing.AttemptId = attempt.AttemptId;
                existing.Fixed = DateTime.UtcNow;
            }

            var levelCommandIds = await _context.LevelCommands
                .Where(lc => lc.LevelId == levelId)
                .Select(lc => lc.CommandId)
                .ToListAsync();

            var already = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId && levelCommandIds.Contains(kb.CommandId))
                .Select(kb => kb.CommandId)
                .ToListAsync();

            var toAdd = levelCommandIds.Except(already).ToList();

            foreach (var cmdId in toAdd)
                _context.KnowledgeBases.Add(new KnowledgeBase { UserId = userId, CommandId = cmdId });

            await _context.SaveChangesAsync();

            if (toAdd.Count > 0)
            {
                unlocked = await _context.Commands
                    .Where(c => toAdd.Contains(c.CommandId))
                    .Select(c => new CommandDto
                    {
                        CommandId = c.CommandId,
                        Name = c.Name,
                        Syntax = c.Syntax,
                        Description = c.Description
                    })
                    .ToListAsync();
            }

            var stats = await _context.PlayerStatistics.FirstOrDefaultAsync(s => s.UserId == userId);
            if (stats != null)
            {
                stats.LevelsPassed = await _context.Results.CountAsync(r => r.UserId == userId);
                stats.TotalScore = await _context.Results
                    .Where(r => r.UserId == userId)
                    .SumAsync(r => r.TotalScore);
                stats.LastUpdate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await UpdateLeaderboardAsync(userId, stats.TotalScore);
            }
        }

        var currentStars = await _context.Results
            .Where(r => r.UserId == userId && r.LevelId == levelId)
            .Select(r => (int?)r.TotalScore)
            .FirstOrDefaultAsync() ?? 0;

        return (currentStars, unlocked);
    }

    private async Task UpdateLeaderboardAsync(int userId, int totalScore)
    {
        var leaderboardEntry = await _context.Leaderboards
            .FirstOrDefaultAsync(l => l.UserId == userId);

        if (leaderboardEntry == null)
        {
            var nextPosition = (await _context.Leaderboards.MaxAsync(l => (int?)l.Position) ?? 0) + 1;

            _context.Leaderboards.Add(new Leaderboard
            {
                Position = nextPosition,
                UserId = userId,
                Login = (await _context.AppUsers.FindAsync(userId))?.Login ?? string.Empty,
                TotalScore = totalScore,
                Updated = DateTime.UtcNow
            });
        }
        else
        {
            leaderboardEntry.TotalScore = totalScore;
            leaderboardEntry.Updated = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private sealed record LevelRuntime(int LevelId, GameMap Map, List<string> AllowedCommands);
}
