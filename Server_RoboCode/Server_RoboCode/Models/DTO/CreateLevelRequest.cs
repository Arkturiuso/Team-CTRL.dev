namespace Server_RoboCode.Models.DTO;

public class CreateLevelRequest
{
    public string LevelName { get; set; } = null!;
    public string? Description { get; set; }
    public object MapData { get; set; } = null!;
    public int DifficultyId { get; set; }
    public int LevelStatusId { get; set; }
    public List<int> CommandIds { get; set; } = new();
}

public class CommandDto
{
    public int CommandId { get; set; }
    public string Name { get; set; } = null!;
    public string Syntax { get; set; } = null!;
    public string? Description { get; set; }
}

public class CreateCommandDto
{
    public string Name { get; set; } = null!;
    public string Syntax { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateCommandDto
{
    public string? Syntax { get; set; }
    public string? Description { get; set; }
}