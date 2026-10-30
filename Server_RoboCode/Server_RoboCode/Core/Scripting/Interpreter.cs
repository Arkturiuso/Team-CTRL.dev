using System.Diagnostics;
using System.Globalization;
using Server_RoboCode.Core.Game;

namespace Server_RoboCode.Core.Scripting;

/// <summary>
/// Исполнитель обучаемого подмножества Python. Программа управляет объектом robot,
/// а все игровые правила проверяет LevelSimulator на сервере.
/// </summary>
public sealed class Interpreter
{
    private const int MaxSteps = 60000;
    private const int MaxCallDepth = 80;

    private readonly LevelSimulator _simulator;
    private readonly HashSet<string> _allowed;
    private readonly RobotBridge _robot;
    private readonly Stopwatch _clock = Stopwatch.StartNew();
    private int _steps;
    private int _depth;

    public Interpreter(LevelSimulator simulator, IEnumerable<string> allowedCommands)
    {
        _simulator = simulator;
        _allowed = new HashSet<string>(allowedCommands.Select(c => c.ToLowerInvariant()), StringComparer.Ordinal);
        _robot = new RobotBridge(simulator, this);
    }

    public SimulationResult Run(List<Stmt> program)
    {
        var globals = new Environment(null);
        RegisterBuiltins(globals);
        RegisterRobotAliases(globals);
        globals.Define("robot", _robot);

        try
        {
            foreach (var statement in program)
                Execute(statement, globals);

            return _simulator.Finish();
        }
        catch (ScriptError error)
        {
            return _simulator.Finish(error.Message, error.Line);
        }
        catch (SimulationException error)
        {
            return _simulator.Finish(error.Message, null);
        }
        catch (RobotDestroyedException)
        {
            return _simulator.Finish(null, null, destroyed: true);
        }
        catch (ReturnSignal)
        {
            return _simulator.Finish("'return' можно использовать только внутри функции", null);
        }
        catch (BreakSignal)
        {
            return _simulator.Finish("'break' можно использовать только внутри цикла", null);
        }
        catch (ContinueSignal)
        {
            return _simulator.Finish("'continue' можно использовать только внутри цикла", null);
        }
        catch (Exception error)
        {
            return _simulator.Finish($"Ошибка выполнения: {error.Message}", null);
        }
    }

    private void Execute(Stmt statement, Environment env)
    {
        Tick(statement.Line);

        switch (statement)
        {
            case ExprStmt expr:
                Evaluate(expr.Expr, env);
                break;

            case AssignStmt assign:
            {
                var value = Evaluate(assign.Value, env);
                if (assign.Op != "=")
                {
                    var current = env.Get(assign.Name, assign.Line);
                    value = ApplyBinary(assign.Op[..^1], current, value, assign.Line);
                }
                env.Define(assign.Name, value);
                break;
            }

            case IfStmt ifStatement:
            {
                foreach (var branch in ifStatement.Branches)
                {
                    if (!IsTruthy(Evaluate(branch.Condition, env))) continue;
                    ExecuteBlock(branch.Body, env);
                    return;
                }

                if (ifStatement.ElseBody != null) ExecuteBlock(ifStatement.ElseBody, env);
                break;
            }

            case WhileStmt whileStatement:
            {
                while (IsTruthy(Evaluate(whileStatement.Condition, env)))
                {
                    Tick(whileStatement.Line);
                    try
                    {
                        ExecuteBlock(whileStatement.Body, env);
                    }
                    catch (ContinueSignal) { }
                    catch (BreakSignal) { break; }
                }
                break;
            }

            case ForStmt forStatement:
            {
                RequireFeature("for", forStatement.Line);
                var iterable = Evaluate(forStatement.Iterable, env);
                var items = ToIterable(iterable, forStatement.Line);

                foreach (var item in items)
                {
                    Tick(forStatement.Line);
                    env.Define(forStatement.Variable, item);
                    try
                    {
                        ExecuteBlock(forStatement.Body, env);
                    }
                    catch (ContinueSignal) { }
                    catch (BreakSignal) { break; }
                }
                break;
            }

            case DefStmt def:
            {
                RequireFeature("def", def.Line);
                env.Define(def.Name, new UserFunction(def.Name, def.Parameters, def.Body, env));
                break;
            }

            case ReturnStmt returnStatement:
                throw new ReturnSignal(returnStatement.Value == null ? null : Evaluate(returnStatement.Value, env));

            case BreakStmt:
                throw new BreakSignal();

            case ContinueStmt:
                throw new ContinueSignal();

            case PassStmt:
                break;

            default:
                throw new ScriptError("Неизвестная конструкция языка", statement.Line);
        }
    }

    private void ExecuteBlock(List<Stmt> body, Environment env)
    {
        foreach (var statement in body)
            Execute(statement, env);
    }

    private object? Evaluate(Expr expression, Environment env)
    {
        Tick(expression.Line);

        switch (expression)
        {
            case LiteralExpr literal:
                return literal.Value;

            case VarExpr variable:
                return env.Get(variable.Name, variable.Line);

            case ListExpr list:
                return list.Items.Select(item => Evaluate(item, env)).ToList();

            case UnaryExpr unary:
            {
                var value = Evaluate(unary.Operand, env);
                return unary.Op switch
                {
                    "not" => !IsTruthy(value),
                    "-" => -ToNumber(value, unary.Line),
                    "+" => ToNumber(value, unary.Line),
                    _ => throw new ScriptError($"Неизвестный оператор {unary.Op}", unary.Line)
                };
            }

            case LogicalExpr logical:
            {
                var left = Evaluate(logical.Left, env);
                if (logical.Op == "and")
                    return IsTruthy(left) ? Evaluate(logical.Right, env) : left;
                return IsTruthy(left) ? left : Evaluate(logical.Right, env);
            }

            case BinaryExpr binary:
            {
                var left = Evaluate(binary.Left, env);
                var right = Evaluate(binary.Right, env);
                return ApplyBinary(binary.Op, left, right, binary.Line);
            }

            case SubscriptExpr subscript:
            {
                var target = Evaluate(subscript.Target, env);
                var index = Evaluate(subscript.Index, env);
                return ApplySubscript(target, index, subscript.Line);
            }

            case AttributeExpr attribute:
                throw new ScriptError($"Атрибут '{attribute.Name}' можно использовать только при вызове метода", attribute.Line);

            case CallExpr call:
                return EvaluateCall(call, env);

            default:
                throw new ScriptError("Неподдерживаемое выражение", expression.Line);
        }
    }

    private object? EvaluateCall(CallExpr call, Environment env)
    {
        if (call.Callee is AttributeExpr attribute)
        {
            var target = Evaluate(attribute.Target, env);
            if (target is RobotBridge bridge)
            {
                var args = call.Arguments.Select(a => Evaluate(a, env)).ToList();
                return bridge.Call(attribute.Name, args, call.Line);
            }
            throw new ScriptError($"У объекта нет метода '{attribute.Name}'", call.Line);
        }

        var callee = Evaluate(call.Callee, env);
        var arguments = call.Arguments.Select(a => Evaluate(a, env)).ToList();
        return Invoke(callee, arguments, call.Line);
    }

    private object? Invoke(object? callee, List<object?> arguments, int line)
    {
        switch (callee)
        {
            case BuiltinFunction builtin:
                return builtin.Invoke(arguments, line);

            case UserFunction function:
            {
                if (arguments.Count != function.Parameters.Count)
                    throw new ScriptError($"Функция {function.Name} ожидает {function.Parameters.Count} аргумент(ов), передано {arguments.Count}", line);

                if (_depth++ > MaxCallDepth)
                    throw new ScriptError("Слишком глубокая рекурсия", line);

                var scope = new Environment(function.Closure);
                for (var i = 0; i < function.Parameters.Count; i++)
                    scope.Define(function.Parameters[i], arguments[i]);

                try
                {
                    ExecuteBlock(function.Body, scope);
                    return null;
                }
                catch (ReturnSignal signal)
                {
                    return signal.Value;
                }
                finally
                {
                    _depth--;
                }
            }

            default:
                throw new ScriptError("Это не функция - вызвать нельзя", line);
        }
    }

    private object? ApplyBinary(string op, object? left, object? right, int line)
    {
        if (op == "+" && (left is string || right is string))
            return Format(left) + Format(right);

        if (op is "==" or "!=")
        {
            var equal = ValuesEqual(left, right);
            return op == "==" ? equal : !equal;
        }

        if (op is "<" or "<=" or ">" or ">=")
        {
            var comparison = Compare(left, right, line);
            return op switch
            {
                "<" => comparison < 0,
                "<=" => comparison <= 0,
                ">" => comparison > 0,
                _ => comparison >= 0
            };
        }

        var a = ToNumber(left, line);
        var b = ToNumber(right, line);

        return op switch
        {
            "+" => a + b,
            "-" => a - b,
            "*" => a * b,
            "/" => b == 0 ? throw new ScriptError("Деление на ноль", line) : a / b,
            "//" => b == 0 ? throw new ScriptError("Деление на ноль", line) : Math.Floor(a / b),
            "%" => b == 0 ? throw new ScriptError("Остаток от деления на ноль", line) : a % b,
            "**" => Math.Pow(a, b),
            _ => throw new ScriptError($"Неизвестный оператор {op}", line)
        };
    }

    private object? ApplySubscript(object? target, object? index, int line)
    {
        if (target is List<object?> list)
        {
            var i = (int)ToNumber(index, line);
            if (i < 0) i += list.Count;
            if (i < 0 || i >= list.Count)
                throw new ScriptError("Индекс вне диапазона списка", line);
            return list[i];
        }

        if (target is string text)
        {
            var i = (int)ToNumber(index, line);
            if (i < 0) i += text.Length;
            if (i < 0 || i >= text.Length)
                throw new ScriptError("Индекс вне диапазона строки", line);
            return text[i].ToString();
        }

        throw new ScriptError("Индексировать можно только список или строку", line);
    }

    private List<object?> ToIterable(object? value, int line)
    {
        if (value is List<object?> list) return list;
        if (value is string text) return text.Select(c => (object?)c.ToString()).ToList();
        throw new ScriptError("В цикле for нужен список или range()", line);
    }

    private static bool ValuesEqual(object? left, object? right)
    {
        if (left is null && right is null) return true;
        if (left is null || right is null) return false;
        if (IsNumber(left) && IsNumber(right))
            return Math.Abs(ToNumber(left, 0) - ToNumber(right, 0)) < 1e-9;
        return left.Equals(right);
    }

    private static int Compare(object? left, object? right, int line)
    {
        if (IsNumber(left) && IsNumber(right))
            return ToNumber(left, line).CompareTo(ToNumber(right, line));
        if (left is string a && right is string b)
            return string.CompareOrdinal(a, b);
        throw new ScriptError("Сравнивать можно числа или строки", line);
    }

    private static bool IsNumber(object? value) => value is double or float or int or long;

    private static double ToNumber(object? value, int line) => value switch
    {
        double d => d,
        float f => f,
        int i => i,
        long l => l,
        bool b => b ? 1 : 0,
        _ => throw new ScriptError("Ожидалось число", line)
    };

    private static bool IsTruthy(object? value) => value switch
    {
        null => false,
        bool b => b,
        double d => Math.Abs(d) > 1e-12,
        long l => l != 0,
        string s => s.Length > 0,
        List<object?> list => list.Count > 0,
        _ => true
    };

    private static string Format(object? value) => value switch
    {
        null => "None",
        bool b => b ? "True" : "False",
        double d => Math.Abs(d - Math.Round(d)) < 1e-9
            ? ((long)Math.Round(d)).ToString(CultureInfo.InvariantCulture)
            : d.ToString("0.####", CultureInfo.InvariantCulture),
        long l => l.ToString(CultureInfo.InvariantCulture),
        string s => s,
        List<object?> list => "[" + string.Join(", ", list.Select(Format)) + "]",
        _ => value.ToString() ?? "None"
    };

    private void Tick(int line)
    {
        _steps++;
        if (_steps > MaxSteps)
            throw new ScriptError("Превышен лимит шагов программы - возможно, бесконечный цикл", line);
        if (_steps % 256 == 0 && _clock.ElapsedMilliseconds > 1500)
            throw new ScriptError("Программа выполняется слишком долго (лимит 1.5 с)", line);
    }

    private void RequireFeature(string feature, int line)
    {
        if (!_allowed.Contains(feature))
            throw new ScriptError($"Конструкция '{feature}' ещё не открыта на этом уровне", line);
    }

    /// <summary>
    /// Короткие формы robot.move(), robot.turn_left() и т.п.: подсказки уровней
    /// часто пишут команды без префикса robot, и это не должно ломать запуск.
    /// </summary>
    private void RegisterRobotAliases(Environment globals)
    {
        foreach (var method in new[] { "move", "turn_left", "turn_right", "attack" })
            globals.Define(method, new BuiltinFunction((args, line) => _robot.Call(method, args, line)));
    }

    private void RegisterBuiltins(Environment globals)
    {
        globals.Define("print", new BuiltinFunction((args, line) =>
        {
            _simulator.AddConsole(line, string.Join(" ", args.Select(Format)));
            return null;
        }));

        globals.Define("len", new BuiltinFunction((args, line) =>
        {
            if (args.Count != 1) throw new ScriptError("len() ожидает один аргумент", line);
            return args[0] switch
            {
                string s => (double)s.Length,
                List<object?> list => (double)list.Count,
                _ => throw new ScriptError("len() работает со строкой или списком", line)
            };
        }));

        globals.Define("range", new BuiltinFunction((args, line) =>
        {
            double start = 0, stop, step = 1;
            if (args.Count == 1) stop = ToNumber(args[0], line);
            else if (args.Count == 2) { start = ToNumber(args[0], line); stop = ToNumber(args[1], line); }
            else if (args.Count == 3) { start = ToNumber(args[0], line); stop = ToNumber(args[1], line); step = ToNumber(args[2], line); }
            else throw new ScriptError("range() принимает 1-3 аргумента", line);

            if (Math.Abs(step) < 1e-9) throw new ScriptError("Шаг range() не может быть нулём", line);

            var result = new List<object?>();
            for (var value = start; step > 0 ? value < stop : value > stop; value += step)
            {
                if (result.Count >= 1000) throw new ScriptError("range() слишком большой (лимит 1000)", line);
                result.Add(value);
            }
            return result;
        }));

        globals.Define("str", new BuiltinFunction((args, line) =>
        {
            if (args.Count != 1) throw new ScriptError("str() ожидает один аргумент", line);
            return Format(args[0]);
        }));

        globals.Define("int", new BuiltinFunction((args, line) =>
        {
            if (args.Count != 1) throw new ScriptError("int() ожидает один аргумент", line);
            if (args[0] is string text)
                return double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
                    ? Math.Truncate(parsed)
                    : throw new ScriptError($"Не удалось преобразовать '{text}' в число", line);
            return Math.Truncate(ToNumber(args[0], line));
        }));

        globals.Define("abs", new BuiltinFunction((args, line) =>
        {
            if (args.Count != 1) throw new ScriptError("abs() ожидает один аргумент", line);
            return Math.Abs(ToNumber(args[0], line));
        }));

        globals.Define("min", new BuiltinFunction((args, line) =>
        {
            if (args.Count == 0) throw new ScriptError("min() нужен хотя бы один аргумент", line);
            return args.Select(a => ToNumber(a, line)).Min();
        }));

        globals.Define("max", new BuiltinFunction((args, line) =>
        {
            if (args.Count == 0) throw new ScriptError("max() нужен хотя бы один аргумент", line);
            return args.Select(a => ToNumber(a, line)).Max();
        }));
    }

    private sealed class ReturnSignal : Exception
    {
        public object? Value { get; }
        public ReturnSignal(object? value) => Value = value;
    }

    private sealed class BreakSignal : Exception { }

    private sealed class ContinueSignal : Exception { }

    private sealed class UserFunction
    {
        public string Name { get; }
        public List<string> Parameters { get; }
        public List<Stmt> Body { get; }
        public Environment Closure { get; }

        public UserFunction(string name, List<string> parameters, List<Stmt> body, Environment closure)
        {
            Name = name;
            Parameters = parameters;
            Body = body;
            Closure = closure;
        }
    }

    private sealed class BuiltinFunction
    {
        private readonly Func<List<object?>, int, object?> _invoke;

        public BuiltinFunction(Func<List<object?>, int, object?> invoke) => _invoke = invoke;

        public object? Invoke(List<object?> arguments, int line) => _invoke(arguments, line);
    }

    private sealed class Environment
    {
        private readonly Dictionary<string, object?> _values = new(StringComparer.Ordinal);
        private readonly Environment? _parent;

        public Environment(Environment? parent) => _parent = parent;

        public void Define(string name, object? value) => _values[name] = value;

        public object? Get(string name, int line)
        {
            if (_values.TryGetValue(name, out var value)) return value;
            if (_parent != null) return _parent.Get(name, line);
            throw new ScriptError($"Имя '{name}' не определено", line);
        }
    }

    /// <summary>Мост между интерпретатором и игровым миром.</summary>
    private sealed class RobotBridge
    {
        private readonly LevelSimulator _simulator;
        private readonly Interpreter _interpreter;

        public RobotBridge(LevelSimulator simulator, Interpreter interpreter)
        {
            _simulator = simulator;
            _interpreter = interpreter;
        }

        public object? Call(string method, List<object?> args, int line)
        {
            switch (method)
            {
                case "move":
                    Require("move", line, args, 0);
                    _simulator.Move(line);
                    return null;

                case "turn_left":
                    Require("turn_left", line, args, 0);
                    _simulator.TurnLeft(line);
                    return null;

                case "turn_right":
                    Require("turn_right", line, args, 0);
                    _simulator.TurnRight(line);
                    return null;

                case "attack":
                    Require("attack", line, args, 0);
                    _simulator.Attack(line);
                    return null;

                default:
                    throw new ScriptError($"У робота нет метода '{method}'", line);
            }
        }

        private void Require(string feature, int line, List<object?> args, int expected)
        {
            if (!_interpreter._allowed.Contains(feature))
                throw new ScriptError($"Команда robot.{feature}() ещё не открыта на этом уровне", line);
            RequireArgs(args, expected, line);
        }

        private static void RequireArgs(List<object?> args, int expected, int line)
        {
            if (args.Count != expected)
                throw new ScriptError($"Метод ожидает {expected} аргумент(ов), передано {args.Count}", line);
        }
    }
}
