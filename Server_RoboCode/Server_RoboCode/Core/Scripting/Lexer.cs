using System.Globalization;
using System.Text;

namespace Server_RoboCode.Core.Scripting;

public enum TokenKind
{
    Number,
    String,
    Identifier,
    Keyword,
    Operator,
    NewLine,
    Indent,
    Dedent,
    EndOfFile
}

public sealed class Token
{
    public TokenKind Kind { get; init; }
    public string Text { get; init; } = string.Empty;
    public object? Value { get; init; }
    public int Line { get; init; }

    public override string ToString() => $"{Kind}:{Text}";
}

/// <summary>
/// Лексер для обучаемого подмножества Python: отступы, строки, числа, комментарии.
/// </summary>
public sealed class Lexer
{
    private static readonly HashSet<string> Keywords = new(StringComparer.Ordinal)
    {
        "if", "elif", "else", "while", "for", "in", "def", "return",
        "break", "continue", "pass", "and", "or", "not", "True", "False", "None"
    };

    private readonly string _source;
    private readonly List<Token> _tokens = new();
    private readonly Stack<int> _indents = new();
    private int _pos;
    private int _line = 1;
    private int _column = 1;
    private bool _lineStart = true;

    public Lexer(string source)
    {
        _source = (source ?? string.Empty)
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Replace('\u00A0', ' ')
            .Replace("\uFEFF", string.Empty)
            .Replace("\u200B", string.Empty);
        _indents.Push(0);
    }

    public List<Token> Tokenize()
    {
        while (_pos < _source.Length)
        {
            if (_lineStart)
            {
                if (HandleLineStart()) continue;
                if (_pos >= _source.Length) break;
            }

            var ch = Current;

            if (ch == '\n')
            {
                Emit(TokenKind.NewLine, "\\n", null, _line);
                Advance();
                _line++;
                _column = 1;
                _lineStart = true;
                continue;
            }

            if (ch == ' ' || ch == '\t')
            {
                Advance();
                continue;
            }

            if (ch == '#')
            {
                while (_pos < _source.Length && Current != '\n') Advance();
                continue;
            }

            if (char.IsDigit(ch))
            {
                ReadNumber();
                continue;
            }

            if (ch == '\'' || ch == '"')
            {
                ReadString(ch);
                continue;
            }

            if (char.IsLetter(ch) || ch == '_')
            {
                ReadIdentifier();
                continue;
            }

            ReadOperator();
        }

        if (_tokens.Count > 0 && _tokens[^1].Kind != TokenKind.NewLine && _tokens[^1].Kind != TokenKind.Indent)
            Emit(TokenKind.NewLine, "\\n", null, _line);

        while (_indents.Count > 1)
        {
            _indents.Pop();
            Emit(TokenKind.Dedent, string.Empty, null, _line);
        }

        Emit(TokenKind.EndOfFile, string.Empty, null, _line);
        return _tokens;
    }

    private char Current => _pos < _source.Length ? _source[_pos] : '\0';

    private bool HandleLineStart()
    {
        var indent = 0;
        while (_pos < _source.Length)
        {
            if (Current == ' ')
            {
                indent++;
                Advance();
            }
            else if (Current == '\t')
            {
                indent += 4;
                Advance();
            }
            else break;
        }

        if (_pos >= _source.Length)
            return false;

        if (Current == '\n')
        {
            Advance();
            _line++;
            _column = 1;
            return true;
        }

        if (Current == '#')
        {
            while (_pos < _source.Length && Current != '\n') Advance();
            return true;
        }

        _lineStart = false;

        if (indent > _indents.Peek())
        {
            _indents.Push(indent);
            Emit(TokenKind.Indent, string.Empty, null, _line);
        }
        else if (indent < _indents.Peek())
        {
            while (_indents.Count > 1 && indent < _indents.Peek())
            {
                _indents.Pop();
                Emit(TokenKind.Dedent, string.Empty, null, _line);
            }

            if (indent != _indents.Peek())
                throw new ScriptError("Некорректный отступ: проверьте пробелы в начале строки", _line);
        }

        return false;
    }

    private void ReadNumber()
    {
        var start = _pos;
        var startLine = _line;
        var hasDot = false;

        while (_pos < _source.Length && (char.IsDigit(Current) || Current == '_' || Current == '.'))
        {
            if (Current == '.')
            {
                if (hasDot) break;
                hasDot = true;
            }
            Advance();
        }

        var text = _source.Substring(start, _pos - start).Replace("_", string.Empty);
        if (hasDot)
        {
            if (!double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var d))
                throw new ScriptError($"Некорректное число: {text}", startLine);
            Emit(TokenKind.Number, text, d, startLine);
        }
        else
        {
            if (!long.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var l))
                throw new ScriptError($"Некорректное число: {text}", startLine);
            Emit(TokenKind.Number, text, (double)l, startLine);
        }
    }

    private void ReadString(char quote)
    {
        var startLine = _line;
        Advance();
        var sb = new StringBuilder();

        while (_pos < _source.Length && Current != quote)
        {
            if (Current == '\n')
                throw new ScriptError("Незакрытая строка", startLine);

            if (Current == '\\')
            {
                Advance();
                if (_pos >= _source.Length) break;
                var escaped = Current;
                sb.Append(escaped switch
                {
                    'n' => '\n',
                    't' => '\t',
                    'r' => '\r',
                    '\\' => '\\',
                    '\'' => '\'',
                    '"' => '"',
                    _ => escaped
                });
                Advance();
                continue;
            }

            sb.Append(Current);
            Advance();
        }

        if (_pos >= _source.Length)
            throw new ScriptError("Незакрытая строка", startLine);

        Advance();
        Emit(TokenKind.String, sb.ToString(), sb.ToString(), startLine);
    }

    private void ReadIdentifier()
    {
        var start = _pos;
        var startLine = _line;

        while (_pos < _source.Length && (char.IsLetterOrDigit(Current) || Current == '_')) Advance();

        var text = _source.Substring(start, _pos - start);
        Emit(Keywords.Contains(text) ? TokenKind.Keyword : TokenKind.Identifier, text, null, startLine);
    }

    private void ReadOperator()
    {
        var startLine = _line;
        var two = _pos + 1 < _source.Length ? _source.Substring(_pos, 2) : string.Empty;

        if (two is "==" or "!=" or "<=" or ">=" or "+=" or "-=" or "*=" or "/=" or "//" or "**")
        {
            Advance();
            Advance();
            Emit(TokenKind.Operator, two, null, startLine);
            return;
        }

        var ch = Current;
        if ("+-*/%<>=()[],:.".IndexOf(ch) >= 0)
        {
            Advance();
            Emit(TokenKind.Operator, ch.ToString(), null, startLine);
            return;
        }

        throw new ScriptError($"Неизвестный символ '{ch}'", startLine);
    }

    private void Advance()
    {
        _pos++;
        _column++;
    }

    private void Emit(TokenKind kind, string text, object? value, int line)
    {
        _tokens.Add(new Token { Kind = kind, Text = text, Value = value, Line = line });
    }
}
