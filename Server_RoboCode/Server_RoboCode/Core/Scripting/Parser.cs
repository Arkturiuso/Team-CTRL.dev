namespace Server_RoboCode.Core.Scripting;

/// <summary>
/// Рекурсивный парсер подмножества Python. Поддерживает if/elif/else, while, for,
/// def, return, break, continue, присваивания и выражения.
/// </summary>
public sealed class Parser
{
    private readonly List<Token> _tokens;
    private int _index;

    public Parser(List<Token> tokens) => _tokens = tokens;

    public List<Stmt> ParseProgram()
    {
        var statements = new List<Stmt>();

        while (!Check(TokenKind.EndOfFile))
        {
            if (Match(TokenKind.NewLine)) continue;
            statements.Add(ParseStatement());
        }

        return statements;
    }

    private Stmt ParseStatement()
    {
        if (CheckKeyword("if")) return ParseIf();
        if (CheckKeyword("while")) return ParseWhile();
        if (CheckKeyword("for")) return ParseFor();
        if (CheckKeyword("def")) return ParseDef();

        var stmt = ParseSimpleStatement();
        Consume(TokenKind.NewLine, "ожидался перевод строки");
        return stmt;
    }

    private List<Stmt> ParseBlock()
    {
        Consume(TokenKind.NewLine, "ожидался перевод строки после ':'");
        Consume(TokenKind.Indent, "ожидался отступ (4 пробела) после ':'");

        var body = new List<Stmt>();

        while (!Check(TokenKind.Dedent) && !Check(TokenKind.EndOfFile))
        {
            if (Match(TokenKind.NewLine)) continue;
            body.Add(ParseStatement());
        }

        Consume(TokenKind.Dedent, "проверьте отступы блока");

        if (body.Count == 0)
            throw new ScriptError("Блок не может быть пустым", Current.Line);

        return body;
    }

    private Stmt ParseIf()
    {
        var line = Advance().Line;
        var branches = new List<IfBranch>();

        var condition = ParseExpression();
        ConsumeOperator(":", "ожидался ':' после условия");
        branches.Add(new IfBranch { Condition = condition, Body = ParseBlock() });

        while (CheckKeyword("elif"))
        {
            Advance();
            var elifCondition = ParseExpression();
            ConsumeOperator(":", "ожидался ':' после условия");
            branches.Add(new IfBranch { Condition = elifCondition, Body = ParseBlock() });
        }

        List<Stmt>? elseBody = null;
        if (CheckKeyword("else"))
        {
            Advance();
            ConsumeOperator(":", "ожидался ':' после else");
            elseBody = ParseBlock();
        }

        return new IfStmt { Line = line, Branches = branches, ElseBody = elseBody };
    }

    private Stmt ParseWhile()
    {
        var line = Advance().Line;
        var condition = ParseExpression();
        ConsumeOperator(":", "ожидался ':' после условия");
        var body = ParseBlock();
        return new WhileStmt { Line = line, Condition = condition, Body = body };
    }

    private Stmt ParseFor()
    {
        var line = Advance().Line;
        var variable = Consume(TokenKind.Identifier, "ожидалось имя переменной после for").Text;
        ConsumeKeyword("in", "ожидалось 'in' в цикле for");
        var iterable = ParseExpression();
        ConsumeOperator(":", "ожидался ':' после заголовка for");
        var body = ParseBlock();
        return new ForStmt { Line = line, Variable = variable, Iterable = iterable, Body = body };
    }

    private Stmt ParseDef()
    {
        var line = Advance().Line;
        var name = Consume(TokenKind.Identifier, "ожидалось имя функции после def").Text;
        ConsumeOperator("(", "ожидалась '(' после имени функции");
        var parameters = new List<string>();

        if (!CheckOperator(")"))
        {
            do
            {
                parameters.Add(Consume(TokenKind.Identifier, "ожидалось имя параметра").Text);
            } while (MatchOperator(","));
        }

        ConsumeOperator(")", "ожидалась ')' после параметров");
        ConsumeOperator(":", "ожидался ':' после заголовка функции");
        var body = ParseBlock();
        return new DefStmt { Line = line, Name = name, Parameters = parameters, Body = body };
    }

    private Stmt ParseSimpleStatement()
    {
        var line = Current.Line;

        if (CheckKeyword("return"))
        {
            Advance();
            Expr? value = null;
            if (!Check(TokenKind.NewLine) && !Check(TokenKind.EndOfFile))
                value = ParseExpression();
            return new ReturnStmt { Line = line, Value = value };
        }

        if (CheckKeyword("break")) { Advance(); return new BreakStmt { Line = line }; }
        if (CheckKeyword("continue")) { Advance(); return new ContinueStmt { Line = line }; }
        if (CheckKeyword("pass")) { Advance(); return new PassStmt { Line = line }; }

        if (Check(TokenKind.Identifier) && _index + 1 < _tokens.Count &&
            _tokens[_index + 1].Kind == TokenKind.Operator &&
            _tokens[_index + 1].Text is "=" or "+=" or "-=" or "*=" or "/=")
        {
            var name = Advance().Text;
            var op = Advance().Text;
            var value = ParseExpression();
            return new AssignStmt { Line = line, Name = name, Op = op, Value = value };
        }

        return new ExprStmt { Line = line, Expr = ParseExpression() };
    }

    private Expr ParseExpression() => ParseOr();

    private Expr ParseOr()
    {
        var left = ParseAnd();
        while (CheckKeyword("or"))
        {
            var line = Advance().Line;
            left = new LogicalExpr { Line = line, Op = "or", Left = left, Right = ParseAnd() };
        }
        return left;
    }

    private Expr ParseAnd()
    {
        var left = ParseNot();
        while (CheckKeyword("and"))
        {
            var line = Advance().Line;
            left = new LogicalExpr { Line = line, Op = "and", Left = left, Right = ParseNot() };
        }
        return left;
    }

    private Expr ParseNot()
    {
        if (CheckKeyword("not"))
        {
            var line = Advance().Line;
            return new UnaryExpr { Line = line, Op = "not", Operand = ParseNot() };
        }
        return ParseComparison();
    }

    private Expr ParseComparison()
    {
        var left = ParseAdditive();

        while (Check(TokenKind.Operator) && Current.Text is "==" or "!=" or "<" or "<=" or ">" or ">=")
        {
            var op = Advance();
            left = new BinaryExpr { Line = op.Line, Op = op.Text, Left = left, Right = ParseAdditive() };
        }

        return left;
    }

    private Expr ParseAdditive()
    {
        var left = ParseMultiplicative();

        while (Check(TokenKind.Operator) && Current.Text is "+" or "-")
        {
            var op = Advance();
            left = new BinaryExpr { Line = op.Line, Op = op.Text, Left = left, Right = ParseMultiplicative() };
        }

        return left;
    }

    private Expr ParseMultiplicative()
    {
        var left = ParseUnary();

        while (Check(TokenKind.Operator) && Current.Text is "*" or "/" or "//" or "%")
        {
            var op = Advance();
            left = new BinaryExpr { Line = op.Line, Op = op.Text, Left = left, Right = ParseUnary() };
        }

        return left;
    }

    private Expr ParseUnary()
    {
        if (Check(TokenKind.Operator) && Current.Text is "-" or "+")
        {
            var op = Advance();
            return new UnaryExpr { Line = op.Line, Op = op.Text, Operand = ParseUnary() };
        }

        return ParsePower();
    }

    private Expr ParsePower()
    {
        var left = ParsePrimary();
        if (Check(TokenKind.Operator) && Current.Text == "**")
        {
            var op = Advance();
            return new BinaryExpr { Line = op.Line, Op = "**", Left = left, Right = ParseUnary() };
        }
        return left;
    }

    private Expr ParsePrimary()
    {
        var token = Current;

        if (token.Kind == TokenKind.Number && token.Value is not null)
        {
            Advance();
            return new LiteralExpr { Line = token.Line, Value = token.Value };
        }

        if (token.Kind == TokenKind.String)
        {
            Advance();
            return new LiteralExpr { Line = token.Line, Value = token.Value };
        }

        if (token.Kind == TokenKind.Keyword)
        {
            switch (token.Text)
            {
                case "True": Advance(); return new LiteralExpr { Line = token.Line, Value = true };
                case "False": Advance(); return new LiteralExpr { Line = token.Line, Value = false };
                case "None": Advance(); return new LiteralExpr { Line = token.Line, Value = null };
            }
        }

        if (token.Kind == TokenKind.Identifier)
        {
            Advance();
            Expr expr = new VarExpr { Line = token.Line, Name = token.Text };

            while (true)
            {
                if (MatchOperator("."))
                {
                    var member = Consume(TokenKind.Identifier, "ожидалось имя атрибута после '.'");
                    expr = new AttributeExpr { Line = member.Line, Target = expr, Name = member.Text };
                }
                else if (MatchOperator("("))
                {
                    var args = new List<Expr>();
                    if (!CheckOperator(")"))
                    {
                        do
                        {
                            args.Add(ParseExpression());
                        } while (MatchOperator(","));
                    }
                    ConsumeOperator(")", "ожидалась ')' после аргументов");
                    expr = new CallExpr { Line = token.Line, Callee = expr, Arguments = args };
                }
                else if (MatchOperator("["))
                {
                    var index = ParseExpression();
                    ConsumeOperator("]", "ожидалась ']'");
                    expr = new SubscriptExpr { Line = token.Line, Target = expr, Index = index };
                }
                else break;
            }

            return expr;
        }

        if (MatchOperator("("))
        {
            var inner = ParseExpression();
            ConsumeOperator(")", "ожидалась ')'");
            return inner;
        }

        if (MatchOperator("["))
        {
            var items = new List<Expr>();
            if (!CheckOperator("]"))
            {
                do
                {
                    items.Add(ParseExpression());
                } while (MatchOperator(","));
            }
            ConsumeOperator("]", "ожидалась ']' после списка");
            return new ListExpr { Line = token.Line, Items = items };
        }

        var message = token.Kind switch
        {
            TokenKind.NewLine => "Неожиданный конец строки - проверьте скобки и операторы",
            TokenKind.EndOfFile => "Неожиданный конец программы - проверьте скобки и операторы",
            _ => $"Неожиданный элемент '{token.Text}'"
        };

        throw new ScriptError(message, token.Line);
    }

    private Token Current => _tokens[_index];

    private Token Advance()
    {
        var token = _tokens[_index];
        if (_index < _tokens.Count - 1) _index++;
        return token;
    }

    private bool Check(TokenKind kind) => Current.Kind == kind;

    private bool CheckKeyword(string keyword) => Current.Kind == TokenKind.Keyword && Current.Text == keyword;

    private bool CheckOperator(string op) => Current.Kind == TokenKind.Operator && Current.Text == op;

    private bool Match(TokenKind kind)
    {
        if (!Check(kind)) return false;
        Advance();
        return true;
    }

    private bool MatchOperator(string op)
    {
        if (!CheckOperator(op)) return false;
        Advance();
        return true;
    }

    private Token Consume(TokenKind kind, string message)
    {
        if (Check(kind)) return Advance();
        throw new ScriptError($"Синтаксическая ошибка: {message} (строка {Current.Line})", Current.Line);
    }

    private void ConsumeKeyword(string keyword, string message)
    {
        if (CheckKeyword(keyword)) { Advance(); return; }
        throw new ScriptError($"Синтаксическая ошибка: {message} (строка {Current.Line})", Current.Line);
    }

    private void ConsumeOperator(string op, string message)
    {
        if (CheckOperator(op)) { Advance(); return; }
        throw new ScriptError($"Синтаксическая ошибка: {message} (строка {Current.Line})", Current.Line);
    }
}
