using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=robocode-db;Port=3306;Database=robocode;User=root;Password=root_secure_pass;SslMode=None;AllowPublicKeyRetrieval=True;";

builder.Services.AddDbContext<RobocodeContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 0)),
        mySqlOptions => mySqlOptions.EnableRetryOnFailure()
    )
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ILoggerService, LoggerService>();
builder.Services.AddSingleton<ResponseSender>();
builder.Services.AddScoped<Brain>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ILevelService, LevelService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:8081",
            "http://localhost:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapControllers();

app.Run();