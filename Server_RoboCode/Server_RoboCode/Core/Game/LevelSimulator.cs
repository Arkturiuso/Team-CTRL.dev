namespace Server_RoboCode.Core.Game;

public enum Direction
{
    Up,
    Right,
    Down,
    Left
}

/// <summary>
/// Детерминированная модель игрового мира: робот, стены, лёд, монеты, ключи и враги.
/// Все действия робота попадают в кадры, которые фронтенд проигрывает как анимацию.
/// </summary>
public sealed class LevelSimulator
{
    private const int MaxActions = 500;
    private const int MaxFrames = 480;

    private readonly GameMap _map;
    private readonly HashSet<int> _collectedCoins = new();
    private readonly HashSet<Pos> _collectedKeys = new();
    private readonly HashSet<Pos> _fakeKeys;
    private readonly List<EnemyState> _enemies = new();
    private readonly List<GameFrame> _frames = new();
    private readonly List<ConsoleEntry> _console = new();
    private int _actionGuard;
    private bool _crashed;
    private bool _errorInCode;
    private bool _defeated;
    private bool _hasRequiredKey;
    private Pos? _droppedKeyPosition;
    private Pos _exit;
    private int _playerHp;
    private readonly int _playerMaxHp;
    private int _attackCooldown;
    private int _fakeKeyHits;
    private Pos? _bossAim;
    private bool _bossAimFresh;
    private Pos? _bossMark;
    private bool _bossMarkShot;
    private readonly List<HazardState> _hazards = new();
    private readonly List<Pos> _bossPath = new();
    private int _bossMoveCounter;
    private int _bossHazardCounter;
    private int _hazardId;
    private bool _bossRaged;
    private Pos? _bossStepFrom;
    private Pos? _bossStepTo;

    public Pos RobotPosition { get; private set; }
    public Direction Facing { get; private set; }
    public int Ticks { get; private set; }
    public bool Finished { get; private set; }
    public bool Success { get; private set; }
    public string? FinishMessage { get; private set; }
    public GameMap Map => _map;
    public Pos CurrentExit => _exit;
    public int PlayerHp => _playerHp;
    public int PlayerMaxHp => _playerMaxHp;
    public int AttackCooldown => _attackCooldown;
    public bool Defeated => _defeated;
    public int FakeKeyHits => _fakeKeyHits;
    public Pos? BossAim => _bossAim;
    public Pos? BossMark => _bossMark;
    public IReadOnlyList<HazardSnapshot> Hazards => SnapshotHazards();
    public string? BossTarget => _bossPath.Count > 0 ? _bossPath[^1].Name : null;
    public bool BossRaging => _bossRaged;
    public bool BossCharging => _bossAim != null;
    public string? BossHint => _map.BossKeyHint;
    public int RealKeysTotal => _map.RealKeys.Count();
    public int RealKeysCollected => _map.RealKeys.Count(position => _collectedKeys.Contains(position));
    public IReadOnlyCollection<Pos> RemainingFakeKeys => _fakeKeys;

    public LevelSimulator(GameMap map)
    {
        _map = map;
        _exit = map.Exit;
        _fakeKeys = new HashSet<Pos>(map.FakeKeys);
        _playerMaxHp = map.Boss?.PlayerHp ?? 0;
        _playerHp = _playerMaxHp;
        RobotPosition = map.Entrance;
        Facing = map.EntranceDirection switch
        {
            "up" => Direction.Up,
            "down" => Direction.Down,
            "left" => Direction.Left,
            _ => Direction.Right
        };

        foreach (var def in map.Enemies)
            _enemies.Add(new EnemyState(def));
    }

    public bool HasKey => _map.RequiredKeyPosition is null || _hasRequiredKey;

    public IReadOnlyCollection<int> CollectedCoins => _collectedCoins;

    public IEnumerable<string> CollectedKeyNames => _collectedKeys.Select(key => key.Name);

    public bool CarriedKey => !HasKey && _enemies.Any(enemy => enemy.Alive && enemy.Definition.CarriesKey);

    public bool BossAlive => _enemies.Any(enemy => enemy.Alive && enemy.Definition.Boss);

    public bool BossDefeated => _enemies.Any(enemy => enemy.Definition.Boss) && !BossAlive;

    public Pos? KeyPosition
    {
        get
        {
            var required = _map.RequiredKeyPosition;
            if (required is null || _hasRequiredKey) return null;

            var carrier = _enemies.FirstOrDefault(enemy => enemy.Definition.CarriesKey);
            if (carrier is null) return required;

            return carrier.Alive ? null : (_droppedKeyPosition ?? carrier.Position);
        }
    }

    public IReadOnlyList<EnemySnapshot> Enemies => _enemies.Select(enemy => new EnemySnapshot
    {
        Id = enemy.Definition.Id,
        Type = enemy.Definition.Type,
        X = enemy.Position.X,
        Y = enemy.Position.Y,
        Alive = enemy.Alive,
        Hp = enemy.Hp,
        MaxHp = enemy.Definition.Hp,
        Boss = enemy.Definition.Boss,
        HasKey = enemy.Definition.CarriesKey && enemy.Alive && !_hasRequiredKey,
        Shielded = IsShielded(enemy)
    }).ToList();

    public string FacingName() => Facing.ToString().ToLowerInvariant();

    /// <summary>Начинает новый запуск, сохраняя состояние робота и мира между запусками.</summary>
    public void BeginRun()
    {
        Finished = false;
        Success = false;
        FinishMessage = null;
        _crashed = false;
        _errorInCode = false;
        _defeated = false;
        _actionGuard = 0;
        _frames.Clear();
        _console.Clear();

        var atEntrance = RobotPosition == _map.Entrance;
        PushFrame("start", atEntrance ? "Робот на старте" : "Робот продолжает путь", null, new List<int>(), new List<string>());
    }

    public void Move(int line)
    {
        EnsureNotFinished();
        GuardActions();
        TickCooldown();

        var next = Step(RobotPosition, Facing);

        var boss = _enemies.FirstOrDefault(e => e.Alive && e.Definition.Boss && e.Position == next);
        if (boss != null)
        {
            DamagePlayer(1);
            PushFrame("boss_touch", $"Босс не подпускает близко: -1 HP", line, new List<int>(), new List<string>(), "boss");
            if (_playerHp <= 0) FailPlayer();
            return;
        }

        if (!_map.CanStep(RobotPosition, next))
            throw new RobotCrashedException("Робот врезался в препятствие - запуск завершён");

        var collectedCoins = new List<int>();
        var collectedKeys = new List<string>();
        RobotPosition = next;
        Ticks++;
        if (_map.TerrainAt(RobotPosition) == "mud") Ticks++;

        var outcome = CollectAt(RobotPosition, collectedCoins, collectedKeys);
        PushFrame("move", null, line, collectedCoins, collectedKeys);
        HandleCollected(outcome, line);

        SlideOnIce(line, collectedCoins, collectedKeys);
        AfterRobotAction(line);
    }

    public void TurnLeft(int line)
    {
        EnsureNotFinished();
        GuardActions();
        TickCooldown();

        Facing = (Direction)(((int)Facing + 3) % 4);
        Ticks++;
        PushFrame("turn", null, line, new List<int>(), new List<string>());
        AfterRobotAction(line);
    }

    public void TurnRight(int line)
    {
        EnsureNotFinished();
        GuardActions();
        TickCooldown();

        Facing = (Direction)(((int)Facing + 1) % 4);
        Ticks++;
        PushFrame("turn", null, line, new List<int>(), new List<string>());
        AfterRobotAction(line);
    }

    public void Attack(int line) => Attack(line, 1);

    public void Attack(int line, int range)
    {
        EnsureNotFinished();
        GuardActions();
        TickCooldown();

        if (_attackCooldown > 0)
        {
            Ticks++;
            PushFrame("cooldown", $"Перезарядка ракеты: ещё {_attackCooldown} действий", line, new List<int>(), new List<string>());
            AfterRobotAction(line);
            return;
        }

        if (range < 1)
            throw new SimulationException("Дальность атаки должна быть положительной");

        var maxRange = _map.Boss?.AttackRange ?? 8;
        if (range > maxRange)
            throw new SimulationException($"Слишком большая дальность: максимум {maxRange} клеток");

        var target = FindTarget(range);
        Ticks++;

        if (target == null)
        {
            PushFrame("attack", "Ракета не задела цель", line, new List<int>(), new List<string>());
            ArmBossCounter(line);
            CooldownAfterAttack();
            AfterRobotAction(line);
            return;
        }

        if (IsShielded(target))
        {
            PushFrame(
                "attack",
                target.Definition.ShieldUntilKey
                    ? "Босс под щитом - сначала найдите настоящий ключ"
                    : $"Босс защищён - соберите все монеты ({_collectedCoins.Count}/{_map.Coins.Count})",
                line,
                new List<int>(),
                new List<string>(),
                target.Definition.Boss ? "boss" : null);
            CooldownAfterAttack();
            AfterRobotAction(line);
            return;
        }

        target.Hp--;

        if (target.Hp > 0)
        {
            var message = target.Definition.Boss
                ? $"{_map.Boss?.HitLine ?? "Босс ранен."} Осталось {target.Hp} из {target.Definition.Hp} HP"
                : $"Враг ранен: осталось {target.Hp} из {target.Definition.Hp}";
            PushFrame("attack", message, line, new List<int>(), new List<string>(), target.Definition.Boss ? "boss" : null);
            if (target.Definition.Boss)
            {
                ArmBossCounter(line);
                CheckBossRage(line);
                PlanBossRelocation(line);
            }

            CooldownAfterAttack();
            AfterRobotAction(line);
            return;
        }

        target.Alive = false;
        if (target.Definition.Boss)
        {
            _bossAim = null;
            _bossAimFresh = false;
            _bossMark = null;
            _bossMarkShot = false;
            _bossPath.Clear();
            _bossRaged = false;
            _hazards.Clear();
        }

        string killMessage;
        if (target.Definition.CarriesKey)
        {
            _droppedKeyPosition = target.Position;
            killMessage = "Ключ выпал - заберите его";
        }
        else if (target.Definition.Boss)
        {
            killMessage = _map.Boss?.DefeatLine ?? "Босс повержен! Путь к выходу открыт";
        }
        else
        {
            killMessage = "Враг повержен";
        }

        PushFrame("attack", killMessage, line, new List<int>(), new List<string>(), target.Definition.Boss ? "boss" : null);
        CooldownAfterAttack();
        AfterRobotAction(line);
    }

    public void AddConsole(int line, string text)
    {
        if (_console.Count >= 400) return;
        _console.Add(new ConsoleEntry { Line = line, Text = text, Kind = "output" });
    }

    public void RecordCompileError(string message, int? line)
    {
        _console.Add(new ConsoleEntry { Line = line ?? 0, Text = message, Kind = "error" });
    }

    public SimulationResult Finish(string? programError = null, int? errorLine = null, bool destroyed = false, bool crashed = false, bool defeated = false)
    {
        if (Finished) return BuildResult();

        Finished = true;
        _crashed = destroyed || crashed;
        _errorInCode = programError != null;
        _defeated = defeated;

        if (programError != null)
        {
            Success = false;
            FinishMessage = programError;
            PushFrame("error", programError, errorLine, new List<int>(), new List<string>());
        }
        else if (defeated)
        {
            Success = false;
            FinishMessage = _map.Boss?.PlayerDefeatLine ?? "Робот потерял все жизни - уровень начнётся заново";
            PushFrame("defeat", FinishMessage, errorLine, new List<int>(), new List<string>(), "boss");
        }
        else if (destroyed)
        {
            Success = false;
            FinishMessage = "Робот столкнулся с врагом - запуск завершён";
            PushFrame("dead", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else if (RobotPosition != _exit)
        {
            Success = false;
            FinishMessage = "Робот не дошёл до выхода - попробуйте ещё раз";
            PushFrame("error", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else if (BossAlive)
        {
            Success = false;
            FinishMessage = "Босс ещё жив! Сначала победите его";
            PushFrame("locked", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else if (!HasKey)
        {
            Success = false;
            FinishMessage = CarriedKey
                ? "Ключ у врага - победите его, чтобы забрать ключ"
                : KeyPosition is not null
                    ? "Ключ лежит на поле - подберите его"
                    : "Дверь заперта! Сначала соберите обязательный ключ";
            PushFrame("locked", FinishMessage, errorLine, new List<int>(), new List<string>());
        }
        else
        {
            Success = true;
            FinishMessage = "Выход найден!";
            PushFrame("success", FinishMessage, errorLine, new List<int>(), new List<string>());
        }

        return BuildResult();
    }

    private SimulationResult BuildResult()
    {
        var allCoins = _collectedCoins.Count == _map.Coins.Count;
        var stars = Success ? 1 : 0;
        if (Success && allCoins) stars++;

        return new SimulationResult
        {
            Success = Success,
            Status = Success ? "success" : "error",
            ErrorMessage = Success ? null : FinishMessage,
            Ticks = Ticks,
            HasKey = HasKey,
            AtExit = RobotPosition == _exit,
            Stars = stars,
            CollectedCoins = _collectedCoins.Count,
            TotalCoins = _map.Coins.Count,
            Crashed = _crashed,
            ErrorInCode = _errorInCode,
            BossDefeated = BossDefeated,
            Defeated = _defeated,
            PlayerHp = _playerHp,
            PlayerMaxHp = _playerMaxHp,
            AttackCooldown = _attackCooldown,
            KeysCollected = RealKeysCollected,
            KeysTotal = RealKeysTotal,
            FakeKeyHits = _fakeKeyHits,
            Exit = _exit.Name,
            BossName = _map.Boss?.Name,
            Frames = _frames,
            Console = _console
        };
    }

    private EnemyState? FindTarget(int range)
    {
        var cell = RobotPosition;
        for (var step = 1; step <= range; step++)
        {
            var next = Step(cell, Facing);
            if (!_map.IsInside(next) || _map.IsRock(next) || _map.HasWall(cell, next)) return null;
            cell = next;

            var enemy = _enemies.FirstOrDefault(e => e.Alive && e.Position == cell);
            if (enemy != null) return enemy;
        }

        return null;
    }

    private void CooldownAfterAttack()
    {
        _attackCooldown = _map.IsBossLevel ? Math.Max(0, _map.Boss!.Cooldown) : 0;
    }

    private void TickCooldown()
    {
        if (_attackCooldown > 0) _attackCooldown--;
    }

    private void DamagePlayer(int amount)
    {
        if (!_map.IsBossLevel) return;
        _playerHp = Math.Max(0, _playerHp - amount);
    }

    private void FailPlayer()
    {
        _defeated = true;
        throw new PlayerDefeatedException();
    }

    private void SlideOnIce(int line, List<int> collectedCoins, List<string> collectedKeys)
    {
        var slides = 0;
        while (_map.TerrainAt(RobotPosition) == "ice" && slides < 3)
        {
            var next = Step(RobotPosition, Facing);
            if (!_map.CanStep(RobotPosition, next)) break;
            if (_enemies.Any(e => e.Alive && e.Definition.Boss && e.Position == next)) break;

            RobotPosition = next;
            Ticks++;
            slides++;
            var outcome = CollectAt(RobotPosition, collectedCoins, collectedKeys);
            PushFrame("slide", "Скольжение по льду", line, collectedCoins, collectedKeys);
            HandleCollected(outcome, line);
        }
    }

    private CollectOutcome CollectAt(Pos position, List<int> collectedCoins, List<string> collectedKeys)
    {
        foreach (var coin in _map.Coins)
        {
            if (coin.Position != position || !_collectedCoins.Add(coin.Id)) continue;
            collectedCoins.Add(coin.Id);
        }

        var realKey = false;
        if (KeyPosition is Pos keyAt && keyAt == position && !_hasRequiredKey)
        {
            _hasRequiredKey = true;
            if (_collectedKeys.Add(keyAt)) collectedKeys.Add(keyAt.Name);
            realKey = true;
        }

        foreach (var key in _map.RealKeys)
        {
            if (key == _map.RequiredKeyPosition) continue;
            if (key != position || !_collectedKeys.Add(key)) continue;
            collectedKeys.Add(key.Name);
            realKey = true;
        }

        var fakeKey = _fakeKeys.Remove(position);
        return new CollectOutcome(realKey, fakeKey);
    }

    private void HandleCollected(CollectOutcome outcome, int line)
    {
        if (outcome.RealKey && _map.Boss != null)
        {
            PushFrame(
                "key",
                _map.Boss.KeyLine,
                line,
                new List<int>(),
                new List<string>(),
                "boss");

            if (_map.AlternateExit is Pos alternate && _exit != alternate)
            {
                _exit = alternate;
                PushFrame(
                    "exit",
                    "Босс переставил выход! Ищи дверь в другом месте",
                    line,
                    new List<int>(),
                    new List<string>(),
                    "boss");
            }
        }

        if (outcome.FakeKey && _map.IsBossLevel)
        {
            _fakeKeyHits++;
            var damage = _map.Boss!.FakeKeyDamage;
            DamagePlayer(damage);
            PushFrame(
                "fake_key",
                $"{_map.Boss.FakeKeyLine} -{damage} HP",
                line,
                new List<int>(),
                new List<string>(),
                "boss");

            if (_playerHp <= 0) FailPlayer();
        }
    }

    private void AfterRobotAction(int line)
    {
        CheckEnemyContact(line);

        foreach (var enemy in _enemies)
        {
            if (!enemy.Alive || enemy.Definition.Boss) continue;
            enemy.Counter++;
            if (enemy.Counter % enemy.Definition.MoveEvery != 0) continue;
            enemy.MoveNext();
        }

        CheckEnemyContact(line);
        AdvanceBoss(line);
        TickHazards(line);
        SummonHazard(line);
        BossTurn(line);
    }

    /// <summary>
    /// После выстрела по боссу он берёт клетку стрелка на прицел.
    /// Если на роботе висит метка и он стоит рядом с ней, босс бьёт по метке.
    /// </summary>
    private void ArmBossCounter(int line)
    {
        if (!_map.IsBossLevel || !_hasRequiredKey) return;
        if (!_enemies.Any(enemy => enemy.Alive && enemy.Definition.Boss)) return;

        if (_bossMark is Pos mark)
        {
            if (Distance(RobotPosition, mark) <= 1)
            {
                _bossAim = mark;
                _bossAimFresh = true;
                _bossMarkShot = true;
                PushFrame(
                    "boss_charge",
                    _map.Boss!.MarkLine.Replace("{cell}", mark.Name),
                    line,
                    new List<int>(),
                    new List<string>(),
                    "boss");
                return;
            }

            _bossMark = null;
            _bossMarkShot = false;
        }

        _bossAim = RobotPosition;
        _bossAimFresh = true;
        PushFrame(
            "boss_charge",
            $"{_map.Boss!.ChargeLine} Клетка {RobotPosition.Name}.",
            line,
            new List<int>(),
            new List<string>(),
            "boss");
    }

    /// <summary>
    /// Ответный залп босса. Обычный прицел бьёт по одной клетке,
    /// залп по метке накрывает саму метку и соседние клетки.
    /// </summary>
    private void BossTurn(int line)
    {
        if (!_map.IsBossLevel) return;

        var boss = _enemies.FirstOrDefault(enemy => enemy.Alive && enemy.Definition.Boss);
        if (boss == null)
        {
            _bossAim = null;
            _bossAimFresh = false;
            _bossMark = null;
            _bossMarkShot = false;
            return;
        }

        if (!_hasRequiredKey) return;

        // Прицел только что выставлен в этом же действии - даём роботу ход на побег.
        if (_bossAimFresh)
        {
            _bossAimFresh = false;
            return;
        }

        if (_bossAim is not Pos aim) return;

        _bossAim = null;

        if (_bossMarkShot)
        {
            _bossMarkShot = false;
            var marked = _bossMark;
            _bossMark = null;

            if (marked is Pos mark && Distance(RobotPosition, mark) <= 1)
            {
                var damage = _map.Boss!.ShotDamage;
                DamagePlayer(damage);
                _bossMark = RobotPosition;
                PushFrame("boss_shot", $"{_map.Boss.MarkShotLine} -{damage} HP", line, new List<int>(), new List<string>(), "boss");
                if (_playerHp <= 0) FailPlayer();
            }
            else
            {
                PushFrame("boss_miss", _map.Boss!.MarkMissLine, line, new List<int>(), new List<string>(), "boss");
            }

            return;
        }

        if (RobotPosition == aim)
        {
            var damage = _map.Boss!.ShotDamage;
            DamagePlayer(damage);
            _bossMark = RobotPosition;
            PushFrame("boss_shot", $"{_map.Boss.ShotLine} -{damage} HP", line, new List<int>(), new List<string>(), "boss");
            if (_playerHp <= 0) FailPlayer();
        }
        else
        {
            PushFrame("boss_miss", _map.Boss!.MissLine, line, new List<int>(), new List<string>(), "boss");
        }
    }

    private static int Distance(Pos a, Pos b) => Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);

    private EnemyState? BossState => _enemies.FirstOrDefault(enemy => enemy.Alive && enemy.Definition.Boss);

    /// <summary>Мало HP - босс впадает в ярость: ходит и вызывает опасности каждое действие.</summary>
    private void CheckBossRage(int line)
    {
        var config = _map.Boss;
        var boss = BossState;
        if (config == null || boss == null || _bossRaged || config.RageAtHp <= 0) return;
        if (boss.Hp > config.RageAtHp) return;

        _bossRaged = true;
        PushFrame("boss_rage", config.RageLine, line, new List<int>(), new List<string>(), "boss");
    }

    /// <summary>
    /// После попадания босс не стоит на пробитой клетке: он шагает к новой
    /// позиции на линии робота, чтобы в него снова пришлось целиться.
    /// </summary>
    private void PlanBossRelocation(int line)
    {
        var config = _map.Boss;
        var boss = BossState;
        _bossPath.Clear();
        _bossMoveCounter = 0;
        if (config == null || boss == null) return;

        var blocked = BossBlockedCells();
        foreach (var target in FiringCells(config).OrderByDescending(cell => Distance(cell, RobotPosition)))
        {
            if (target == boss.Position || blocked.Contains(target)) continue;

            var path = FindPath(boss.Position, target, blocked);
            if (path is null || path.Count is 0 or > 7) continue;

            _bossPath.AddRange(path);
            PushFrame(
                "boss_move",
                $"{config.RelocateLine} Новая клетка - {target.Name}.",
                line,
                new List<int>(),
                new List<string>(),
                "boss");
            return;
        }

        if (StepAway(boss.Position, blocked) is Pos spot)
        {
            _bossPath.Add(spot);
            PushFrame("boss_move", config.RelocateLine, line, new List<int>(), new List<string>(), "boss");
        }
    }

    /// <summary>Один шаг босса по маршруту. В ярости босс идёт на каждое действие робота.</summary>
    private void AdvanceBoss(int line)
    {
        var config = _map.Boss;
        var boss = BossState;
        if (config == null || boss == null)
        {
            _bossPath.Clear();
            return;
        }

        if (_bossPath.Count == 0) return;

        _bossMoveCounter++;
        if (_bossMoveCounter % (_bossRaged ? 1 : Math.Max(1, config.MoveEvery)) != 0) return;

        var next = _bossPath[0];
        _bossPath.RemoveAt(0);
        var from = boss.Position;
        boss.MoveTo(next);

        _bossStepFrom = from;
        _bossStepTo = next;
        PushFrame(
            "boss_move",
            string.IsNullOrWhiteSpace(config.StepLine) ? null : config.StepLine,
            line,
            new List<int>(),
            new List<string>(),
            "boss");
        _bossStepFrom = null;
        _bossStepTo = null;
    }

    /// <summary>Босс периодически обрушивает на клетку робота опасность своего биома.</summary>
    private void SummonHazard(int line)
    {
        var config = _map.Boss;
        if (config == null || BossState == null || !_hasRequiredKey) return;
        if (config.HazardEvery <= 0 || config.HazardDamage <= 0 || _hazards.Count > 0) return;

        _bossHazardCounter++;
        var every = _bossRaged ? Math.Max(2, config.HazardEvery - 2) : config.HazardEvery;
        if (_bossHazardCounter % every != 0) return;

        var cells = HazardFootprint(config.HazardKind, RobotPosition);
        if (cells.Count == 0) return;

        _hazards.Add(new HazardState
        {
            Id = ++_hazardId,
            Kind = config.HazardKind,
            Cells = cells,
            Fuse = config.HazardFuse,
            Damage = config.HazardDamage,
            Linger = config.HazardLinger
        });

        PushFrame(
            "hazard_warn",
            config.HazardLine
                .Replace("{hazard}", HazardText(config.HazardKind).Word)
                .Replace("{cell}", RobotPosition.Name),
            line,
            new List<int>(),
            new List<string>(),
            "boss");
    }

    /// <summary>Опасность догорает по тикам: телеграф, удар по клеткам, затухание.</summary>
    private void TickHazards(int line)
    {
        for (var index = _hazards.Count - 1; index >= 0; index--)
        {
            var hazard = _hazards[index];
            var text = HazardText(hazard.Kind);

            if (hazard.State == "warn")
            {
                hazard.Fuse--;
                if (hazard.Fuse > 0) continue;

                hazard.State = "impact";
                if (hazard.Cells.Contains(RobotPosition))
                {
                    DamagePlayer(hazard.Damage);
                    PushFrame(
                        "hazard_hit",
                        $"{text.Hit.Replace("{cell}", RobotPosition.Name).Replace("{cells}", CellNames(hazard.Cells))}. -{hazard.Damage} HP",
                        line,
                        new List<int>(),
                        new List<string>(),
                        "boss");
                    if (_playerHp <= 0) FailPlayer();
                }
                else
                {
                    PushFrame("hazard_hit", $"{text.Miss}.", line, new List<int>(), new List<string>(), "boss");
                }

                continue;
            }

            hazard.Linger--;
            if (hazard.Linger > 0) continue;

            _hazards.RemoveAt(index);
            PushFrame("hazard_end", null, line, new List<int>(), new List<string>());
        }
    }

    private List<Pos> HazardFootprint(string kind, Pos center)
    {
        var cells = new List<Pos> { center };
        var extra = kind switch
        {
            "sandstorm" => new[] { new Pos(center.X + 1, center.Y) },
            "avalanche" => new[] { new Pos(center.X - 1, center.Y), new Pos(center.X + 1, center.Y) },
            _ => Array.Empty<Pos>()
        };

        foreach (var cell in extra)
            if (_map.IsInside(cell) && !_map.IsRock(cell)) cells.Add(cell);

        return cells;
    }

    private static (string Word, string Hit, string Miss) HazardText(string kind) => kind switch
    {
        "sandstorm" => ("Песчаная буря", "Буря накрыла клетку {cell}", "Буря прошла стороной - ты успел уйти"),
        "avalanche" => ("Снежная доска", "Снег накрыл клетки {cells}", "Снег сошёл рядом - ты успел уйти"),
        "lava" => ("Фонтан лавы", "Лава ударила по клетке {cell}", "Лава ударила мимо - ты успел уйти"),
        _ => ("Дерево", "Дерево рухнуло на клетку {cell}", "Дерево упало мимо - ты успел уйти")
    };

    private static string CellNames(List<Pos> cells) => string.Join(", ", cells.Select(cell => cell.Name));

    /// <summary>Клетки на одной линии с роботом, откуда по боссу можно попасть напрямую.</summary>
    private List<Pos> FiringCells(BossConfig config)
    {
        var cells = new List<Pos>();

        foreach (var direction in Enum.GetValues<Direction>())
        {
            var cell = RobotPosition;
            for (var step = 1; step <= config.AttackRange; step++)
            {
                var next = Step(cell, direction);
                if (!_map.IsInside(next) || _map.IsRock(next) || _map.HasWall(cell, next)) break;

                cell = next;
                if (step >= config.MinDistance) cells.Add(cell);
            }
        }

        return cells;
    }

    private HashSet<Pos> BossBlockedCells()
    {
        var blocked = new HashSet<Pos> { RobotPosition, _map.Entrance, _exit };
        foreach (var key in _map.Keys) blocked.Add(key.Position);
        foreach (var coin in _map.Coins) blocked.Add(coin.Position);
        foreach (var enemy in _enemies.Where(enemy => enemy.Alive && !enemy.Definition.Boss))
            blocked.Add(enemy.Position);

        return blocked;
    }

    private Pos? StepAway(Pos from, HashSet<Pos> blocked)
    {
        Pos? best = null;
        var bestDistance = int.MinValue;

        foreach (var direction in Enum.GetValues<Direction>())
        {
            var next = Step(from, direction);
            if (!_map.CanStep(from, next) || blocked.Contains(next)) continue;
            if (Distance(next, RobotPosition) <= bestDistance) continue;
            bestDistance = Distance(next, RobotPosition);
            best = next;
        }

        return best;
    }

    private List<Pos>? FindPath(Pos from, Pos to, HashSet<Pos> blocked)
    {
        var previous = new Dictionary<Pos, Pos?> { [from] = null };
        var queue = new Queue<Pos>();
        queue.Enqueue(from);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            foreach (var direction in Enum.GetValues<Direction>())
            {
                var next = Step(current, direction);
                if (previous.ContainsKey(next) || !_map.CanStep(current, next)) continue;
                if (next != to && blocked.Contains(next)) continue;

                previous[next] = current;
                if (next == to) return BuildPath(previous, from, to);
                queue.Enqueue(next);
            }
        }

        return null;
    }

    private static List<Pos> BuildPath(Dictionary<Pos, Pos?> previous, Pos from, Pos to)
    {
        var path = new List<Pos>();
        for (var cursor = to; cursor != from; cursor = previous[cursor] ?? from) path.Insert(0, cursor);
        return path;
    }

    private List<HazardSnapshot> SnapshotHazards() => _hazards.Select(hazard => new HazardSnapshot
    {
        Id = hazard.Id,
        Kind = hazard.Kind,
        Cells = hazard.Cells.Select(cell => cell.Name).ToList(),
        State = hazard.State,
        Fuse = hazard.Fuse,
        Damage = hazard.Damage
    }).ToList();

    private void CheckEnemyContact(int line)
    {
        var contact = _enemies.FirstOrDefault(e => e.Alive && e.Position == RobotPosition);
        if (contact == null) return;

        PushFrame("hit", "Робот столкнулся с врагом", line, new List<int>(), new List<string>());
        throw new RobotDestroyedException("Робот столкнулся с врагом - попробуйте другой маршрут");
    }

    private bool IsShielded(EnemyState enemy)
    {
        if (!enemy.Alive) return false;
        if (enemy.Definition.ShieldUntilKey) return !_hasRequiredKey;
        if (enemy.Definition.ShieldUntilAllCoins) return _collectedCoins.Count < _map.Coins.Count;
        return false;
    }

    private void GuardActions()
    {
        _actionGuard++;
        if (_actionGuard > MaxActions)
            throw new SimulationException($"Слишком много действий (лимит {MaxActions}). Проверьте циклы");
    }

    private void EnsureNotFinished()
    {
        if (Finished) throw new SimulationException("Выполнение уже завершено");
    }

    private void PushFrame(string type, string? message, int? line, List<int> collectedCoins, List<string> collectedKeys, string? speaker = null)
    {
        if (_frames.Count >= MaxFrames) return;

        _frames.Add(new GameFrame
        {
            Tick = Ticks,
            Type = type,
            X = RobotPosition.X,
            Y = RobotPosition.Y,
            Direction = FacingName(),
            HasKey = HasKey,
            AtExit = RobotPosition == _exit,
            CollectedCoins = new List<int>(collectedCoins),
            CollectedKeys = new List<string>(collectedKeys),
            Enemies = _enemies.Select(e => new EnemySnapshot
            {
                Id = e.Definition.Id,
                Type = e.Definition.Type,
                X = e.Position.X,
                Y = e.Position.Y,
                Alive = e.Alive,
                Hp = e.Hp,
                MaxHp = e.Definition.Hp,
                Boss = e.Definition.Boss,
                HasKey = e.Definition.CarriesKey && e.Alive && !_hasRequiredKey,
                Shielded = IsShielded(e)
            }).ToList(),
            KeyPosition = KeyPosition?.Name,
            FakeKeys = _fakeKeys.Select(key => key.Name).ToList(),
            Exit = _exit.Name,
            BossAim = _bossAim?.Name,
            BossMark = _bossMark?.Name,
            BossFrom = _bossStepFrom?.Name,
            BossTo = _bossStepTo?.Name,
            Hazards = SnapshotHazards(),
            PlayerHp = _playerHp,
            PlayerMaxHp = _playerMaxHp,
            AttackCooldown = _attackCooldown,
            BossDefeated = BossDefeated,
            Message = message,
            Speaker = speaker,
            Line = line
        });
    }

    private static Pos Step(Pos pos, Direction direction) => direction switch
    {
        Direction.Up => new Pos(pos.X, pos.Y - 1),
        Direction.Down => new Pos(pos.X, pos.Y + 1),
        Direction.Left => new Pos(pos.X - 1, pos.Y),
        _ => new Pos(pos.X + 1, pos.Y)
    };

    private readonly record struct CollectOutcome(bool RealKey, bool FakeKey);

    private sealed class EnemyState
    {
        public EnemyDef Definition { get; }
        public Pos Position { get; private set; }
        public bool Alive { get; set; } = true;
        public int Hp { get; set; }
        public int Counter { get; set; }
        private int _index;

        public EnemyState(EnemyDef definition)
        {
            Definition = definition;
            Position = definition.Patrol[0];
            Hp = definition.Hp;
        }

        public void MoveNext()
        {
            if (Definition.Patrol.Count <= 1) return;
            _index = (_index + 1) % Definition.Patrol.Count;
            Position = Definition.Patrol[_index];
        }

        public void MoveTo(Pos position) => Position = position;
    }

    private sealed class HazardState
    {
        public int Id { get; init; }
        public string Kind { get; init; } = "tree";
        public List<Pos> Cells { get; init; } = new();
        public string State { get; set; } = "warn";
        public int Fuse { get; set; }
        public int Damage { get; init; }
        public int Linger { get; set; }
    }
}
