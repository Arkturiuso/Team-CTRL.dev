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
    public int Attempts { get; private set; }
    public SemaphoreSlim Gate { get; } = new(1, 1);

    public void Restart(LevelSimulator simulator)
    {
        Simulator = simulator;
        Completed = false;
        Attempts = 0;
    }

    public int RegisterAttempt() => ++Attempts;
}

public sealed class LevelSessionStore
{
    private readonly ConcurrentDictionary<(int UserId, int LevelId, bool Preview), LevelSession> _sessions = new();

    public LevelSession Get(int userId, int levelId, bool preview, Func<LevelSimulator> factory)
        => _sessions.GetOrAdd((userId, levelId, preview), _ => new LevelSession(factory()));
}
