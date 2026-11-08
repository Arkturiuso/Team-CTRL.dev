namespace Server_RoboCode.Models.DTO;

public class UserInfo
{
    public string Login { get; set; } = null!;
    public DateTime RegistrationDate { get; set; }
    public string AccountStatusName { get; set; } = null!;
    public string Role { get; set; } = "player";

    public int TotalScore { get; set; }
    public int LevelsPassedCount { get; set; }
}