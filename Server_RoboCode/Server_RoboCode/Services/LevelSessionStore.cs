using System.Collections.Concurrent;
using Server_RoboCode.Core.Game;

namespace Server_RoboCode.Services;

/// <summary>
/// Состояние прохождения уровня конкретным пользователем. Живёт в памяти процесса,
/// поэтому каждый запуск продолжает путь робота с того места, где он остановился.
/// </summary>
public sealed class LevelSession
{
    public LevelSession(LevelSimulator simulator) => Simulator = simulator;

    public LevelSimulator Simulator { get; private set; }
    public bool Completed { get; set; }
    public SemaphoreSlim Gate { get; } = new(1, 1);

    public void Reset(LevelSimulator simulator)
    {
        Simulator = simulator;
        Completed = false;
    }
}

public sealed class LevelSessionStore
{
    private readonly ConcurrentDictionary<(int UserId, int LevelId), LevelSession> _sessions = new();

    public LevelSession Get(int userId, int levelId, Func<LevelSimulator> factory)
        => _sessions.GetOrAdd((userId, levelId), _ => new LevelSession(factory()));

    public void Reset(int userId, int levelId, Func<LevelSimulator> factory)
        => Get(userId, levelId, factory).Reset(factory());
}
