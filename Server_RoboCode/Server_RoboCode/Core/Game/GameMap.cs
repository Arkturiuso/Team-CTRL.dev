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

public sealed class EnemyDef
{
    public int Id { get; init; }
    public string Type { get; init; } = "slime";
    public List<Pos> Patrol { get; init; } = new();
    public int MoveEvery { get; init; } = 2;
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
    public HashSet<Pos> Rocks { get; } = new();
    public List<WallEdge> Walls { get; } = new();
    public Dictionary<Pos, string> Terrain { get; } = new();
    public List<CoinDef> Coins { get; } = new();
    public List<Pos> Keys { get; } = new();
    public Pos? RequiredKeyPosition { get; private set; }
    public List<EnemyDef> Enemies { get; } = new();
    public int ThreeStarRuns { get; private set; }

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
            ThreeStarRuns = Math.Max(1, GetInt(root, "three_star_runs") ?? 3)
        };

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
            foreach (var key in keys.EnumerateArray())
            {
                string? position = key.ValueKind == JsonValueKind.String
                    ? key.GetString()
                    : GetString(key, "position");
                if (Pos.TryParse(position, out var pos) && map.IsInside(pos) && !map.Rocks.Contains(pos))
                    map.Keys.Add(pos);
            }
        }

        if (Pos.TryParse(GetString(root, "required_key_position"), out var required) && map.IsInside(required))
        {
            map.RequiredKeyPosition = required;
            if (!map.Keys.Contains(required)) map.Keys.Add(required);
        }
        else if (map.Keys.Count > 0)
        {
            map.RequiredKeyPosition = map.Keys[0];
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

                map.Enemies.Add(new EnemyDef
                {
                    Id = GetInt(enemy, "id") ?? ++id,
                    Type = (GetString(enemy, "type") ?? "slime").ToLowerInvariant(),
                    Patrol = patrol,
                    MoveEvery = Math.Clamp(GetInt(enemy, "move_every") ?? 2, 1, 10)
                });
            }
        }

        if (!map.IsWalkable(map.Entrance)) map.Rocks.Remove(map.Entrance);
        if (!map.IsWalkable(map.Exit)) map.Rocks.Remove(map.Exit);
        map.Coins.RemoveAll(c => c.Position == map.Entrance || c.Position == map.Exit);

        return map;
    }

    private static int? GetInt(JsonElement element, string name)
        => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var result)
            ? result
            : null;

    private static string? GetString(JsonElement element, string name)
        => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

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
