using System.Collections.Concurrent;

namespace Server_RoboCode.Services;

/// <summary>
/// Гейты по ключу (userId, levelId, preview): сериализуют одновременные run/state/reset
/// одной сессии. Само состояние прохождения в памяти не живёт - оно загружается и
/// сохраняется в БД (см. RunSessionPersistence), поэтому переживает перезапуск API.
/// Preview-сессия администратора получает отдельный гейт и не влияет на игровую.
/// </summary>
public sealed class LevelSessionStore
{
    private readonly ConcurrentDictionary<(int UserId, int LevelId, bool Preview), SemaphoreSlim> _gates = new();

    public SemaphoreSlim GetGate(int userId, int levelId, bool preview)
        => _gates.GetOrAdd((userId, levelId, preview), _ => new SemaphoreSlim(1, 1));
}
