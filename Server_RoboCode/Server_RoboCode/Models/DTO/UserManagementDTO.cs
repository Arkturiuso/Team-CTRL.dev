using System;

namespace Server_RoboCode.Models.DTO;

public class AdminUserDto
{
    public int UserId { get; set; }
    public string Login { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int AccountStatusId { get; set; }
    public string AccountStatusName { get; set; } = null!;
    public DateTime Registration { get; set; }
}

public class UpdateUserStatusDto
{
    public int AccountStatusId { get; set; }
}