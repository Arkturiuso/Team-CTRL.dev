namespace Server_RoboCode.Core.Scripting;

public abstract class Stmt
{
    public int Line { get; init; }
}

public sealed class ExprStmt : Stmt
{
    public Expr Expr { get; init; } = null!;
}

public sealed class AssignStmt : Stmt
{
    public string Name { get; init; } = null!;
    public string Op { get; init; } = "=";
    public Expr Value { get; init; } = null!;
}

public sealed class IfStmt : Stmt
{
    public List<IfBranch> Branches { get; init; } = new();
    public List<Stmt>? ElseBody { get; init; }
}

public sealed class IfBranch
{
    public Expr Condition { get; init; } = null!;
    public List<Stmt> Body { get; init; } = new();
}

public sealed class WhileStmt : Stmt
{
    public Expr Condition { get; init; } = null!;
    public List<Stmt> Body { get; init; } = new();
}

public sealed class ForStmt : Stmt
{
    public string Variable { get; init; } = null!;
    public Expr Iterable { get; init; } = null!;
    public List<Stmt> Body { get; init; } = new();
}

public sealed class DefStmt : Stmt
{
    public string Name { get; init; } = null!;
    public List<string> Parameters { get; init; } = new();
    public List<Stmt> Body { get; init; } = new();
}

public sealed class ReturnStmt : Stmt
{
    public Expr? Value { get; init; }
}

public sealed class BreakStmt : Stmt { }

public sealed class ContinueStmt : Stmt { }

public sealed class PassStmt : Stmt { }

public abstract class Expr
{
    public int Line { get; init; }
}

public sealed class LiteralExpr : Expr
{
    public object? Value { get; init; }
}

public sealed class VarExpr : Expr
{
    public string Name { get; init; } = null!;
}

public sealed class UnaryExpr : Expr
{
    public string Op { get; init; } = null!;
    public Expr Operand { get; init; } = null!;
}

public sealed class BinaryExpr : Expr
{
    public string Op { get; init; } = null!;
    public Expr Left { get; init; } = null!;
    public Expr Right { get; init; } = null!;
}

public sealed class LogicalExpr : Expr
{
    public string Op { get; init; } = null!;
    public Expr Left { get; init; } = null!;
    public Expr Right { get; init; } = null!;
}

public sealed class CallExpr : Expr
{
    public Expr Callee { get; init; } = null!;
    public List<Expr> Arguments { get; init; } = new();
}

public sealed class AttributeExpr : Expr
{
    public Expr Target { get; init; } = null!;
    public string Name { get; init; } = null!;
}

public sealed class SubscriptExpr : Expr
{
    public Expr Target { get; init; } = null!;
    public Expr Index { get; init; } = null!;
}

public sealed class ListExpr : Expr
{
    public List<Expr> Items { get; init; } = new();
}

public sealed class ScriptError : Exception
{
    public int Line { get; }

    public ScriptError(string message, int line) : base(message) => Line = line;
}
