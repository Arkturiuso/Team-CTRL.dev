namespace Server_RoboCode.Models
{
    public class UserInfo
    {
        public string Login { get; set; } = null!;
        public DateTime RegistrationDate { get; set; }
        public string AccountStatusName { get; set; } = null!; // "active" -> "Активен"
        public string Role { get; set; } = "player";

        // Эти значения можно вычислять на бэке или фронте
        public int TotalStars { get; set; }
        public int LevelsPassedCount { get; set; }
    }
}
