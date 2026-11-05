using System.Text.Json;

namespace Server_RoboCode.Core.Game;

public readonly record struct Pos(int X, int Y)
{
    public static bool TryParse(string? value, out Pos pos)
    {
        pos = default;
        if (string.IsNullOrWhiteSpace(value) || value.Length < 2) return false;

        var x = char.ToUpperInvariant(value[0]) - 'A';
        if (x < 0 || x >= 26) return false;
        if (!int.TryParse(value[1..], out var row) || row < 1) return false;

        pos = new Pos(x, row - 1);
        return true;
    }

    public string Name => $"{(char)('A' + X)}{Y + 1}";

    public bool IsAdjacent(Pos other) => Math.Abs(X - other.X) + Math.Abs(Y - other.Y) == 1;
}

public sealed class WallEdge
{
    public Pos A { get; init; }
    public Pos B { get; init; }
    public int Id { get; init; }
}

public sealed class CoinDef
{
    public int Id { get; init; }
    public Pos Position { get; init; }
}

public sealed class KeyDef
{
    public int Id { get; init; }
    public Pos Position { get; init; }
    public bool Fake { get; init; }
}

public sealed class BossConfig
{
    public string Name { get; init; } = "Босс";
    public string Title { get; init; } = string.Empty;
    public string Avatar { get; init; } = "forest";
    public int Hp { get; init; } = 3;
    public int PlayerHp { get; init; } = 3;
    public int AttackRange { get; init; } = 6;
    public int Cooldown { get; init; } = 2;
    public int FakeKeyDamage { get; init; } = 1;
    public int ShotDamage { get; init; } = 1;
    public string Ability { get; init; } = string.Empty;
    public List<string> Intro { get; init; } = new();
    public string KeyLine { get; init; } = "Настоящий. Но выход я открою после боя: до него ты просто гость с ключом.";
    public string FakeKeyLine { get; init; } = "Фальшивка. Минус жизнь: я не каждый раз даю право на ошибку.";
    public string HitLine { get; init; } = "Больно. Продолжай - мне нужно это запомнить.";
    public string DefeatLine { get; init; } = "Годится. Дверь открыта, иди и не оборачивайся.";
    public string PlayerDefeatLine { get; init; } = "Слишком мало жизней для слишком больших амбиций. Заново.";
    public string ChargeLine { get; init; } = "Целюсь в твою клетку. Уйдёшь - промахнусь красиво.";
    public string ShotLine { get; init; } = "Есть. Стоять на месте - твой выбор, а не моя вина.";
    public string MissLine { get; init; } = "Мимо. Ты двигаешься - значит, мы понимаем друг друга.";
    public string MarkLine { get; init; } = "Метка на клетке {cell}: следующий залп возьмёт её и соседей. Уходи далеко.";
    public string MarkShotLine { get; init; } = "Метка сработала. Оставаться в ней было планом, а не случайностью?";
    public string MarkMissLine { get; init; } = "Вышел из метки. Отмечено.";
    public string KeyHintLine { get; init; } = "Настоящий ключ лежит {direction} меня. Остальные я положил, чтобы ты подумал.";
    public int MoveEvery { get; init; } = 2;
    public bool FleeAfterHit { get; init; } = true;
    public int RageAtHp { get; init; } = 2;
    public int MinDistance { get; init; } = 2;
    public string HazardKind { get; init; } = "tree";
    public int HazardEvery { get; init; } = 5;
    public int HazardFuse { get; init; } = 3;
    public int HazardDamage { get; init; } = 1;
    public int HazardLinger { get; init; } = 2;
    public string RelocateLine { get; init; } = "Ухожу с простреленной клетки. Догоняй - так быстрее.";
    public string StepLine { get; init; } = "Меняю позицию. Не жди, что я буду стоять где поставили.";
    public string RageLine { get; init; } = "Последняя жизнь. Теперь я двигаюсь на каждое твоё действие.";
    public string HazardLine { get; init; } = "{hazard} накрывает клетку {cell}. Уходи - оно не вежливое.";
}

public sealed class EnemyDef
{
    public int Id { get; init; }
    public string Type { get; init; } = "slime";
    public List<Pos> Patrol { get; init; } = new();
    public int MoveEvery { get; init; } = 2;
    public int Hp { get; init; } = 1;
    public bool Boss { get; init; }
    public bool CarriesKey { get; init; }
    public bool ShieldUntilAllCoins { get; init; }
    public bool ShieldUntilKey { get; init; }
}

public sealed class GameMap
{
    public int Width { get; private init; }
    public int Height { get; private init; }
    public string Biome { get; private init; } = "forest";
    public string LevelName { get; private init; } = "Уровень";
    public string? Hint { get; private init; }
    public Pos Entrance { get; private init; }
    public string EntranceDirection { get; private init; } = "right";
    public Pos Exit { get; private init; }
    public Pos? AlternateExit { get; private init; }
    public HashSet<Pos> Rocks { get; } = new();
    public List<WallEdge> Walls { get; } = new();
    public Dictionary<Pos, string> Terrain { get; } = new();
    public List<CoinDef> Coins { get; } = new();
    public List<KeyDef> Keys { get; } = new();
    public Pos? RequiredKeyPosition { get; private set; }
    public List<EnemyDef> Enemies { get; } = new();
    public BossConfig? Boss { get; private set; }
    public string? BossKeyHint { get; private set; }
    public int ThreeStarRuns { get; private set; }

    public IEnumerable<Pos> RealKeys => Keys.Where(key => !key.Fake).Select(key => key.Position);
    public IEnumerable<Pos> FakeKeys => Keys.Where(key => key.Fake).Select(key => key.Position);
    public bool IsBossLevel => Boss != null;

    public bool IsInside(Pos pos) => pos.X >= 0 && pos.Y >= 0 && pos.X < Width && pos.Y < Height;

    public bool IsRock(Pos pos) => Rocks.Contains(pos);

    public bool HasWall(Pos a, Pos b)
    {
        if (!a.IsAdjacent(b)) return false;
        return Walls.Any(w => (w.A == a && w.B == b) || (w.A == b && w.B == a));
    }

    public bool IsWalkable(Pos pos) => IsInside(pos) && !IsRock(pos);

    public bool CanStep(Pos from, Pos to) => IsWalkable(to) && !HasWall(from, to);

    public string TerrainAt(Pos pos) => Terrain.TryGetValue(pos, out var t) ? t : "ground";

    public static GameMap Parse(string json)
    {
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
        var root = doc.RootElement;

        var width = GetInt(root, "width") ?? 0;
        var height = GetInt(root, "height") ?? 0;
        if (width <= 0 || height <= 0) throw new InvalidOperationException("В данных уровня не указаны размеры карты");
        if (width > 26 || height > 26) throw new InvalidOperationException("Карта слишком большая (максимум 26×26)");

        var entrance = Pos.TryParse(GetString(root, "entrance"), out var e) ? e : new Pos(0, 0);
        var exit = Pos.TryParse(GetString(root, "exit"), out var x) ? x : new Pos(width - 1, height - 1);
        var map = new GameMap
        {
            Width = width,
            Height = height,
            Biome = NormalizeBiome(GetString(root, "biome")),
            LevelName = GetString(root, "level_name") ?? "Уровень",
            Hint = GetString(root, "hint"),
            Entrance = entrance,
            EntranceDirection = NormalizeDirection(GetString(root, "entrance_direction")),
            Exit = exit,
            AlternateExit = Pos.TryParse(GetString(root, "alternate_exit"), out var alt)
                && alt.X >= 0 && alt.Y >= 0 && alt.X < width && alt.Y < height
                ? alt
                : null,
            ThreeStarRuns = Math.Max(1, GetInt(root, "three_star_runs") ?? 3)
        };

        if (root.TryGetProperty("boss", out var bossJson) && bossJson.ValueKind == JsonValueKind.Object)
        {
            var intro = new List<string>();
            if (bossJson.TryGetProperty("intro", out var introJson) && introJson.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in introJson.EnumerateArray())
                    if (item.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(item.GetString()))
                        intro.Add(item.GetString()!);
            }

            var ai = TryGetObject(bossJson, "ai", out var aiJson) ? aiJson : bossJson;
            var hazard = TryGetObject(bossJson, "hazard", out var hazardJson) ? hazardJson : bossJson;

            map.Boss = new BossConfig
            {
                Name = GetString(bossJson, "name") ?? "Босс",
                Title = GetString(bossJson, "title") ?? string.Empty,
                Avatar = (GetString(bossJson, "avatar") ?? map.Biome).ToLowerInvariant(),
                Hp = Math.Clamp(GetInt(bossJson, "hp") ?? 3, 1, 20),
                PlayerHp = Math.Clamp(GetInt(bossJson, "player_hp") ?? 3, 1, 10),
                AttackRange = Math.Clamp(GetInt(bossJson, "attack_range") ?? 6, 2, 12),
                Cooldown = Math.Clamp(GetInt(bossJson, "cooldown") ?? 2, 0, 6),
                FakeKeyDamage = Math.Clamp(GetInt(bossJson, "fake_key_damage") ?? 1, 1, 5),
                ShotDamage = Math.Clamp(GetInt(bossJson, "shot_damage") ?? 1, 1, 3),
                Ability = GetString(bossJson, "ability") ?? string.Empty,
                Intro = intro,
                KeyLine = GetString(bossJson, "key_line") ?? new BossConfig().KeyLine,
                FakeKeyLine = GetString(bossJson, "fake_key_line") ?? new BossConfig().FakeKeyLine,
                HitLine = GetString(bossJson, "hit_line") ?? new BossConfig().HitLine,
                DefeatLine = GetString(bossJson, "defeat_line") ?? new BossConfig().DefeatLine,
                PlayerDefeatLine = GetString(bossJson, "player_defeat_line") ?? new BossConfig().PlayerDefeatLine,
                ChargeLine = GetString(bossJson, "charge_line") ?? new BossConfig().ChargeLine,
                ShotLine = GetString(bossJson, "shot_line") ?? new BossConfig().ShotLine,
                MissLine = GetString(bossJson, "miss_line") ?? new BossConfig().MissLine,
                MarkLine = GetString(bossJson, "mark_line") ?? new BossConfig().MarkLine,
                MarkShotLine = GetString(bossJson, "mark_shot_line") ?? new BossConfig().MarkShotLine,
                MarkMissLine = GetString(bossJson, "mark_miss_line") ?? new BossConfig().MarkMissLine,
                KeyHintLine = GetString(bossJson, "key_hint_line") ?? new BossConfig().KeyHintLine,
                MoveEvery = Math.Clamp(GetInt(ai, "move_every") ?? 2, 1, 6),
                FleeAfterHit = GetBoolOrNull(ai, "flee_after_hit") ?? true,
                RageAtHp = Math.Clamp(GetInt(ai, "rage_at_hp") ?? 2, 0, 10),
                MinDistance = Math.Clamp(GetInt(ai, "min_distance") ?? 2, 1, 6),
                HazardKind = (GetString(hazard, "kind") ?? DefaultHazardKind(map.Biome)).ToLowerInvariant(),
                HazardEvery = Math.Clamp(GetInt(hazard, "every") ?? 5, 0, 20),
                HazardFuse = Math.Clamp(GetInt(hazard, "fuse") ?? 3, 1, 6),
                HazardDamage = Math.Clamp(GetInt(hazard, "damage") ?? 1, 0, 3),
                HazardLinger = Math.Clamp(GetInt(hazard, "linger") ?? 2, 0, 6),
                RelocateLine = GetString(bossJson, "relocate_line") ?? new BossConfig().RelocateLine,
                StepLine = GetString(bossJson, "step_line") ?? new BossConfig().StepLine,
                RageLine = GetString(bossJson, "rage_line") ?? new BossConfig().RageLine,
                HazardLine = GetString(bossJson, "hazard_line") ?? new BossConfig().HazardLine
            };
        }

        if (root.TryGetProperty("walls", out var walls) && walls.ValueKind == JsonValueKind.Array)
        {
            var id = 1;
            foreach (var wall in walls.EnumerateArray())
            {
                if (wall.ValueKind != JsonValueKind.Object) continue;
                if (!Pos.TryParse(GetString(wall, "side1"), out var a)) continue;
                if (!Pos.TryParse(GetString(wall, "side2"), out var b)) continue;
                if (!a.IsAdjacent(b) || !map.IsInside(a) || !map.IsInside(b)) continue;
                map.Walls.Add(new WallEdge { Id = id++, A = a, B = b });
            }
        }

        foreach (var rock in ReadPositions(root, "rocks"))
            if (map.IsInside(rock)) map.Rocks.Add(rock);

        if (root.TryGetProperty("terrain", out var terrain) && terrain.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in terrain.EnumerateObject())
            {
                if (!Pos.TryParse(prop.Name, out var pos) || !map.IsInside(pos)) continue;
                if (prop.Value.ValueKind == JsonValueKind.String)
                    map.Terrain[pos] = prop.Value.GetString()!.ToLowerInvariant();
            }
        }

        if (root.TryGetProperty("coins", out var coins) && coins.ValueKind == JsonValueKind.Array)
        {
            var id = 0;
            foreach (var coin in coins.EnumerateArray())
            {
                if (coin.ValueKind != JsonValueKind.Object) continue;
                if (!Pos.TryParse(GetString(coin, "position"), out var pos) || !map.IsInside(pos)) continue;
                if (map.Rocks.Contains(pos)) continue;
                map.Coins.Add(new CoinDef { Id = GetInt(coin, "id") ?? ++id, Position = pos });
            }
        }

        if (root.TryGetProperty("keys", out var keys) && keys.ValueKind == JsonValueKind.Array)
        {
            var id = 0;
            foreach (var key in keys.EnumerateArray())
            {
                string? position = key.ValueKind == JsonValueKind.String
                    ? key.GetString()
                    : GetString(key, "position");
                if (!Pos.TryParse(position, out var pos) || !map.IsInside(pos) || map.Rocks.Contains(pos)) continue;

                var fake = key.ValueKind == JsonValueKind.Object && GetBool(key, "fake");
                map.Keys.Add(new KeyDef
                {
                    Id = key.ValueKind == JsonValueKind.Object ? GetInt(key, "id") ?? ++id : ++id,
                    Position = pos,
                    Fake = fake
                });
            }
        }

        if (Pos.TryParse(GetString(root, "required_key_position"), out var required) && map.IsInside(required))
        {
            map.RequiredKeyPosition = required;
            if (map.RealKeys.All(position => position != required))
                map.Keys.Add(new KeyDef { Id = map.Keys.Count + 1, Position = required });
        }
        else if (map.RealKeys.Any())
        {
            map.RequiredKeyPosition = map.RealKeys.First();
        }

        if (root.TryGetProperty("enemies", out var enemies) && enemies.ValueKind == JsonValueKind.Array)
        {
            var id = 0;
            foreach (var enemy in enemies.EnumerateArray())
            {
                if (enemy.ValueKind != JsonValueKind.Object) continue;
                var patrol = new List<Pos>();

                if (enemy.TryGetProperty("patrol", out var patrolJson) && patrolJson.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in patrolJson.EnumerateArray())
                        if (item.ValueKind == JsonValueKind.String && Pos.TryParse(item.GetString(), out var p) && map.IsInside(p) && !map.Rocks.Contains(p))
                            patrol.Add(p);
                }

                if (patrol.Count == 0 && Pos.TryParse(GetString(enemy, "position"), out var start) && map.IsInside(start) && !map.Rocks.Contains(start))
                    patrol.Add(start);

                if (patrol.Count == 0) continue;

                var route = new List<Pos> { patrol[0] };
                foreach (var point in patrol.Skip(1))
                {
                    var previous = route[^1];
                    if (point == previous) continue;
                    if (!previous.IsAdjacent(point) || map.HasWall(previous, point)) continue;
                    route.Add(point);
                }

                var isBoss = GetBool(enemy, "boss");
                var carriesKey = GetBool(enemy, "carries_key");

                map.Enemies.Add(new EnemyDef
                {
                    Id = GetInt(enemy, "id") ?? ++id,
                    Type = (GetString(enemy, "type") ?? "slime").ToLowerInvariant(),
                    Patrol = route,
                    MoveEvery = Math.Clamp(GetInt(enemy, "move_every") ?? 2, 1, 10),
                    Hp = Math.Clamp(GetInt(enemy, "hp") ?? (isBoss ? map.Boss?.Hp ?? 3 : 1), 1, 20),
                    Boss = isBoss,
                    CarriesKey = carriesKey,
                    ShieldUntilKey = isBoss && map.Boss != null
                });

                if (carriesKey && map.RequiredKeyPosition is null)
                {
                    map.RequiredKeyPosition = route[0];
                    if (map.Keys.All(key => key.Position != route[0]))
                        map.Keys.Add(new KeyDef { Id = map.Keys.Count + 1, Position = route[0] });
                }
            }
        }

        if (!map.IsWalkable(map.Entrance)) map.Rocks.Remove(map.Entrance);
        if (!map.IsWalkable(map.Exit)) map.Rocks.Remove(map.Exit);
        map.Coins.RemoveAll(c => c.Position == map.Entrance || c.Position == map.Exit);

        return map;
    }

    /// <summary>
    /// Копия карты с перемешанными ключами для конкретной игровой сессии:
    /// настоящий ключ каждый раз в новом месте, фальшивки - в остальных.
    /// </summary>
    public GameMap CreateSessionMap(Random random)
    {
        if (!IsBossLevel || Keys.Count == 0) return this;

        var copy = new GameMap
        {
            Width = Width,
            Height = Height,
            Biome = Biome,
            LevelName = LevelName,
            Hint = Hint,
            Entrance = Entrance,
            EntranceDirection = EntranceDirection,
            Exit = Exit,
            AlternateExit = AlternateExit,
            ThreeStarRuns = ThreeStarRuns,
            Boss = Boss
        };

        copy.Rocks.UnionWith(Rocks);
        copy.Walls.AddRange(Walls);
        foreach (var tile in Terrain) copy.Terrain[tile.Key] = tile.Value;
        copy.Coins.AddRange(Coins);
        copy.Keys.AddRange(Keys);
        copy.Enemies.AddRange(Enemies);

        RelocateBoss(copy, random);

        var boss = copy.Enemies.FirstOrDefault(enemy => enemy.Boss);
        var bossPosition = boss?.Patrol.FirstOrDefault();
        if (bossPosition is not Pos bossAt) return copy;

        var candidates = CollectKeyCandidates(copy.Enemies.SelectMany(enemy => enemy.Patrol));
        var count = Keys.Count;
        if (candidates.Count < count) return copy;

        for (var attempt = 0; attempt < 200; attempt++)
        {
            Shuffle(candidates, random);
            var chosen = candidates.Take(count).ToList();
            var realIndex = random.Next(count);
            if (HasSectorClash(chosen, realIndex, bossAt)) continue;

            ApplyKeys(copy, chosen, realIndex, bossAt);
            return copy;
        }

        var fallback = candidates.Take(count).ToList();
        ApplyKeys(copy, fallback, random.Next(count), bossAt);
        return copy;
    }

    /// <summary>
    /// Между сбросами босс занимает новую клетку в центральной зоне арены.
    /// Ключи и подсказка рассчитываются уже от новой позиции.
    /// </summary>
    private void RelocateBoss(GameMap target, Random random)
    {
        var index = target.Enemies.FindIndex(enemy => enemy.Boss);
        if (index < 0) return;

        var boss = target.Enemies[index];
        if (boss.Patrol.Count == 0) return;

        var origin = boss.Patrol[0];
        const int radius = 2;

        var blocked = new HashSet<Pos> { target.Entrance, target.Exit };
        if (target.AlternateExit is Pos alternate) blocked.Add(alternate);
        foreach (var coin in target.Coins) blocked.Add(coin.Position);
        foreach (var key in target.Keys) blocked.Add(key.Position);
        foreach (var enemy in target.Enemies)
        {
            if (enemy.Boss) continue;
            foreach (var point in enemy.Patrol) blocked.Add(point);
        }

        var candidates = new List<Pos>();
        for (var dy = -radius; dy <= radius; dy++)
        {
            for (var dx = -radius; dx <= radius; dx++)
            {
                if (dx == 0 && dy == 0) continue;
                var pos = new Pos(origin.X + dx, origin.Y + dy);
                if (!target.IsInside(pos) || target.IsRock(pos) || blocked.Contains(pos)) continue;
                candidates.Add(pos);
            }
        }

        if (candidates.Count == 0) return;

        var chosen = candidates[random.Next(candidates.Count)];
        target.Enemies[index] = new EnemyDef
        {
            Id = boss.Id,
            Type = boss.Type,
            Patrol = new List<Pos> { chosen },
            MoveEvery = boss.MoveEvery,
            Hp = boss.Hp,
            Boss = true,
            CarriesKey = boss.CarriesKey,
            ShieldUntilAllCoins = boss.ShieldUntilAllCoins,
            ShieldUntilKey = boss.ShieldUntilKey
        };
    }

    private List<Pos> CollectKeyCandidates(IEnumerable<Pos>? extraBlocked = null)
    {
        var blocked = new HashSet<Pos> { Entrance, Exit };
        if (AlternateExit is Pos alternate) blocked.Add(alternate);
        foreach (var coin in Coins) blocked.Add(coin.Position);
        foreach (var enemy in Enemies)
            foreach (var point in enemy.Patrol) blocked.Add(point);
        if (extraBlocked != null)
            foreach (var point in extraBlocked) blocked.Add(point);

        var reachable = new HashSet<Pos> { Entrance };
        var queue = new Queue<Pos>();
        queue.Enqueue(Entrance);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            foreach (var direction in Enum.GetValues<Direction>())
            {
                var next = Step(current, direction);
                if (reachable.Contains(next) || !CanStep(current, next)) continue;
                reachable.Add(next);
                queue.Enqueue(next);
            }
        }

        blocked.Add(Entrance);
        return reachable.Where(position => !blocked.Contains(position) && !Rocks.Contains(position)).ToList();
    }

    private void ApplyKeys(GameMap target, List<Pos> positions, int realIndex, Pos bossAt)
    {
        target.Keys.Clear();
        for (var index = 0; index < positions.Count; index++)
            target.Keys.Add(new KeyDef { Id = index + 1, Position = positions[index], Fake = index != realIndex });

        target.RequiredKeyPosition = positions[realIndex];
        target.BossKeyHint = BuildKeyHint(positions[realIndex], bossAt);
    }

    private string? BuildKeyHint(Pos realKey, Pos bossAt)
    {
        var template = Boss?.KeyHintLine;
        if (string.IsNullOrWhiteSpace(template)) return null;

        return template.Replace("{direction}", DirectionWord(realKey, bossAt));
    }

    private static bool HasSectorClash(List<Pos> keys, int realIndex, Pos bossAt)
    {
        var real = keys[realIndex];
        var sector = Sector(real, bossAt);
        for (var index = 0; index < keys.Count; index++)
        {
            if (index == realIndex) continue;
            if (Sector(keys[index], bossAt) == sector) return true;
        }

        return false;
    }

    private static (int X, int Y) Sector(Pos key, Pos bossAt)
        => (Math.Sign(key.X - bossAt.X), Math.Sign(key.Y - bossAt.Y));

    private static string DirectionWord(Pos key, Pos bossAt)
    {
        var dx = Math.Sign(key.X - bossAt.X);
        var dy = Math.Sign(key.Y - bossAt.Y);

        return dy switch
        {
            < 0 when dx < 0 => "северо-западнее",
            < 0 when dx > 0 => "северо-восточнее",
            < 0 => "севернее",
            0 when dx < 0 => "западнее",
            0 when dx > 0 => "восточнее",
            > 0 when dx < 0 => "юго-западнее",
            > 0 when dx > 0 => "юго-восточнее",
            _ => "южнее"
        };
    }

    private static void Shuffle<T>(IList<T> items, Random random)
    {
        for (var index = items.Count - 1; index > 0; index--)
        {
            var swap = random.Next(index + 1);
            (items[index], items[swap]) = (items[swap], items[index]);
        }
    }

    private static Pos Step(Pos pos, Direction direction) => direction switch
    {
        Direction.Up => new Pos(pos.X, pos.Y - 1),
        Direction.Down => new Pos(pos.X, pos.Y + 1),
        Direction.Left => new Pos(pos.X - 1, pos.Y),
        _ => new Pos(pos.X + 1, pos.Y)
    };

    private static int? GetInt(JsonElement element, string name)
        => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var result)
            ? result
            : null;

    private static string? GetString(JsonElement element, string name)
        => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static bool GetBool(JsonElement element, string name) => GetBoolOrNull(element, name) ?? false;

    private static bool? GetBoolOrNull(JsonElement element, string name)
        => element.TryGetProperty(name, out var value)
            && value.ValueKind is (JsonValueKind.True or JsonValueKind.False)
            ? value.GetBoolean()
            : null;

    private static bool TryGetObject(JsonElement element, string name, out JsonElement found)
    {
        if (element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Object)
        {
            found = value;
            return true;
        }

        found = default;
        return false;
    }

    private static string DefaultHazardKind(string biome) => biome switch
    {
        "desert" => "sandstorm",
        "snow" => "avalanche",
        "volcano" => "lava",
        _ => "tree"
    };

    private static IEnumerable<Pos> ReadPositions(JsonElement root, string property)
    {
        if (!root.TryGetProperty(property, out var array) || array.ValueKind != JsonValueKind.Array)
            yield break;

        foreach (var item in array.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String && Pos.TryParse(item.GetString(), out var pos))
                yield return pos;
        }
    }

    private static string NormalizeDirection(string? value) => value?.ToLowerInvariant() switch
    {
        "up" or "вверх" => "up",
        "down" or "вниз" => "down",
        "left" or "влево" => "left",
        _ => "right"
    };

    private static string NormalizeBiome(string? value) => value?.ToLowerInvariant() switch
    {
        "snow" or "cave" or "desert" or "swamp" or "volcano" or "forest" => value!.ToLowerInvariant(),
        _ => "forest"
    };
}
