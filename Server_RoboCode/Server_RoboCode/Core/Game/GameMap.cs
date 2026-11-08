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

public sealed class KeyDef
{
    public int Id { get; init; }
    public Pos Position { get; init; }
}

/// <summary>Монета - необязательный коллекционный предмет: на балл и успех не влияет.</summary>
public sealed class CoinDef
{
    public int Id { get; init; }
    public Pos Position { get; init; }
}

/// <summary>
/// Карта уровня-лабиринта по эталону предметной области: клетки, стены-рёбра,
/// камни-препятствия, ключи, монеты, вход и выход-дверь. Боевого контента нет.
/// </summary>
public sealed class GameMap
{
    public int Width { get; private init; }
    public int Height { get; private init; }
    public string LevelName { get; private init; } = "Уровень";
    public string? Description { get; private init; }
    public string? Hint { get; private init; }
    public Pos Entrance { get; private init; }
    public string EntranceDirection { get; private init; } = "right";
    public Pos Exit { get; private init; }
    public HashSet<Pos> Rocks { get; } = new();
    public List<WallEdge> Walls { get; } = new();
    public List<KeyDef> Keys { get; } = new();
    public List<CoinDef> Coins { get; } = new();

    public IEnumerable<Pos> KeyPositions => Keys.Select(key => key.Position);
    public IEnumerable<Pos> CoinPositions => Coins.Select(coin => coin.Position);

    public bool IsInside(Pos pos) => pos.X >= 0 && pos.Y >= 0 && pos.X < Width && pos.Y < Height;

    public bool IsRock(Pos pos) => Rocks.Contains(pos);

    public bool HasWall(Pos a, Pos b)
    {
        if (!a.IsAdjacent(b)) return false;
        return Walls.Any(w => (w.A == a && w.B == b) || (w.A == b && w.B == a));
    }

    public bool IsWalkable(Pos pos) => IsInside(pos) && !IsRock(pos);

    public bool CanStep(Pos from, Pos to) => IsWalkable(to) && !HasWall(from, to);

    public static GameMap Parse(string json)
    {
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
        var root = doc.RootElement;

        var width = GetInt(root, "width") ?? 0;
        var height = GetInt(root, "height") ?? 0;
        if (width <= 0 || height <= 0) throw new InvalidOperationException("В данных уровня не указаны размеры карты");
        if (width > 26 || height > 26) throw new InvalidOperationException("Карта слишком большая (максимум 26x26)");

        var entrance = Pos.TryParse(GetString(root, "entrance"), out var e) ? e : new Pos(0, 0);
        var exit = Pos.TryParse(GetString(root, "exit"), out var x) ? x : new Pos(width - 1, height - 1);
        var map = new GameMap
        {
            Width = width,
            Height = height,
            LevelName = GetString(root, "level_name") ?? "Уровень",
            Description = GetString(root, "description"),
            Hint = GetString(root, "hint"),
            Entrance = entrance,
            EntranceDirection = NormalizeDirection(GetString(root, "entrance_direction")),
            Exit = exit
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

        if (root.TryGetProperty("keys", out var keys) && keys.ValueKind == JsonValueKind.Array)
        {
            var id = 0;
            foreach (var key in keys.EnumerateArray())
            {
                string? position = key.ValueKind == JsonValueKind.String
                    ? key.GetString()
                    : GetString(key, "position");
                if (!Pos.TryParse(position, out var pos) || !map.IsInside(pos) || map.Rocks.Contains(pos)) continue;

                map.Keys.Add(new KeyDef { Id = ++id, Position = pos });
            }
        }

        // Монеты - необязательные коллекционные предметы. Мусор (вне поля, камни,
        // вход, выход, клетка ключа, дубли) молча пропускаем: кривой JSON не роняет уровень.
        if (root.TryGetProperty("coins", out var coins) && coins.ValueKind == JsonValueKind.Array)
        {
            var id = 0;
            var used = new HashSet<Pos>(map.KeyPositions) { map.Entrance, map.Exit };
            foreach (var coin in coins.EnumerateArray())
            {
                string? position = coin.ValueKind == JsonValueKind.String
                    ? coin.GetString()
                    : GetString(coin, "position");
                if (!Pos.TryParse(position, out var pos)) continue;
                if (!map.IsInside(pos) || map.Rocks.Contains(pos)) continue;
                if (!used.Add(pos)) continue;

                map.Coins.Add(new CoinDef { Id = ++id, Position = pos });
            }
        }

        // Вход и выход обязаны быть проходимыми клетками лабиринта.
        if (!map.IsWalkable(map.Entrance)) map.Rocks.Remove(map.Entrance);
        if (!map.IsWalkable(map.Exit)) map.Rocks.Remove(map.Exit);

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
}
