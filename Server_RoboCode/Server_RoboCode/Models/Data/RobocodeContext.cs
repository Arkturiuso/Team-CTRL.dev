using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace Server_RoboCode.Models.Data;

public partial class RobocodeContext : DbContext
{
    public RobocodeContext()
    {
    }

    public RobocodeContext(DbContextOptions<RobocodeContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccountStatus> AccountStatuses { get; set; }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<Attempt> Attempts { get; set; }

    public virtual DbSet<AttemptStatus> AttemptStatuses { get; set; }

    public virtual DbSet<Command> Commands { get; set; }

    public virtual DbSet<Difficulty> Difficulties { get; set; }

    public virtual DbSet<Leaderboard> Leaderboards { get; set; }

    public virtual DbSet<Level> Levels { get; set; }

    public virtual DbSet<LevelStatus> LevelStatuses { get; set; }

    public virtual DbSet<PlayerStatistic> PlayerStatistics { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Result> Results { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;user=root;password=1234;database=robocode", ServerVersion.Parse("8.0.44-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<AccountStatus>(entity =>
        {
            entity.HasKey(e => e.AccountStatusId).HasName("PRIMARY");

            entity
                .ToTable("account_status")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.AccountStatusId).HasColumnName("account_status_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity
                .ToTable("app_user")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.AccountStatusId, "fk_user_account_status");

            entity.HasIndex(e => e.RoleId, "fk_user_role");

            entity.HasIndex(e => e.Login, "login").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AccountStatusId).HasColumnName("account_status_id");
            entity.Property(e => e.Login)
                .HasMaxLength(64)
                .HasColumnName("login");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.Registration)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("registration");
            entity.Property(e => e.RoleId).HasColumnName("role_id");

            entity.HasOne(d => d.AccountStatus).WithMany(p => p.AppUsers)
                .HasForeignKey(d => d.AccountStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_user_account_status");

            entity.HasOne(d => d.Role).WithMany(p => p.AppUsers)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_user_role");

            entity.HasMany(d => d.Commands).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "KnowledgeBase",
                    r => r.HasOne<Command>().WithMany()
                        .HasForeignKey("CommandId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("fk_kb_command"),
                    l => l.HasOne<AppUser>().WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("fk_kb_user"),
                    j =>
                    {
                        j.HasKey("UserId", "CommandId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j
                            .ToTable("knowledge_base")
                            .UseCollation("utf8mb4_unicode_ci");
                        j.HasIndex(new[] { "CommandId" }, "fk_kb_command");
                        j.IndexerProperty<int>("UserId").HasColumnName("user_id");
                        j.IndexerProperty<int>("CommandId").HasColumnName("command_id");
                    });
        });

        modelBuilder.Entity<Attempt>(entity =>
        {
            entity.HasKey(e => e.AttemptId).HasName("PRIMARY");

            entity
                .ToTable("attempt")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.LevelId, "fk_attempt_level");

            entity.HasIndex(e => e.AttemptStatusId, "fk_attempt_status");

            entity.HasIndex(e => e.UserId, "fk_attempt_user");

            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.AttemptStatusId).HasColumnName("attempt_status_id");
            entity.Property(e => e.ErrorMessage)
                .HasColumnType("text")
                .HasColumnName("error_message");
            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.LinesCount).HasColumnName("lines_count");
            entity.Property(e => e.SourceCode)
                .HasColumnType("text")
                .HasColumnName("source_code");
            entity.Property(e => e.Submitted)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("submitted");
            entity.Property(e => e.TickCount).HasColumnName("tick_count");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.AttemptStatus).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.AttemptStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_attempt_status");

            entity.HasOne(d => d.Level).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.LevelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_attempt_level");

            entity.HasOne(d => d.User).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_attempt_user");
        });

        modelBuilder.Entity<AttemptStatus>(entity =>
        {
            entity.HasKey(e => e.AttemptStatusId).HasName("PRIMARY");

            entity
                .ToTable("attempt_status")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.AttemptStatusId).HasColumnName("attempt_status_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Command>(entity =>
        {
            entity.HasKey(e => e.CommandId).HasName("PRIMARY");

            entity
                .ToTable("command")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.CommandId).HasColumnName("command_id");
            entity.Property(e => e.Name)
                .HasMaxLength(64)
                .HasColumnName("name");
            entity.Property(e => e.Syntax)
                .HasMaxLength(255)
                .HasColumnName("syntax");
        });

        modelBuilder.Entity<Difficulty>(entity =>
        {
            entity.HasKey(e => e.DifficultyId).HasName("PRIMARY");

            entity
                .ToTable("difficulty")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.DifficultyId).HasColumnName("difficulty_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Leaderboard>(entity =>
        {
            entity.HasKey(e => e.Position).HasName("PRIMARY");

            entity
                .ToTable("leaderboard")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.UserId, "uq_leaderboard_user").IsUnique();

            entity.Property(e => e.Position)
                .ValueGeneratedNever()
                .HasColumnName("position");
            entity.Property(e => e.Login)
                .HasMaxLength(64)
                .HasColumnName("login");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");
            entity.Property(e => e.Updated)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Leaderboard)
                .HasForeignKey<Leaderboard>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_leaderboard_user");
        });

        modelBuilder.Entity<Level>(entity =>
        {
            entity.HasKey(e => e.LevelId).HasName("PRIMARY");

            entity
                .ToTable("level")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.DifficultyId, "fk_level_difficulty");

            entity.HasIndex(e => e.LevelStatusId, "fk_level_status");

            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.Created)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created");
            entity.Property(e => e.DifficultyId).HasColumnName("difficulty_id");
            entity.Property(e => e.KeysCount).HasColumnName("keys_count");
            entity.Property(e => e.LevelStatusId).HasColumnName("level_status_id");
            entity.Property(e => e.MapConfig)
                .HasColumnType("text")
                .HasColumnName("map_config");
            entity.Property(e => e.MapHeight).HasColumnName("map_height");
            entity.Property(e => e.MapWidth).HasColumnName("map_width");
            entity.Property(e => e.Title)
                .HasMaxLength(128)
                .HasColumnName("title");

            entity.HasOne(d => d.Difficulty).WithMany(p => p.Levels)
                .HasForeignKey(d => d.DifficultyId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_level_difficulty");

            entity.HasOne(d => d.LevelStatus).WithMany(p => p.Levels)
                .HasForeignKey(d => d.LevelStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_level_status");
        });

        modelBuilder.Entity<LevelStatus>(entity =>
        {
            entity.HasKey(e => e.LevelStatusId).HasName("PRIMARY");

            entity
                .ToTable("level_status")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.LevelStatusId).HasColumnName("level_status_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<PlayerStatistic>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity
                .ToTable("player_statistics")
                .UseCollation("utf8mb4_unicode_ci");

            entity.Property(e => e.UserId)
                .ValueGeneratedNever()
                .HasColumnName("user_id");
            entity.Property(e => e.LastUpdate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("last_update");
            entity.Property(e => e.LevelsPassed).HasColumnName("levels_passed");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");

            entity.HasOne(d => d.User).WithOne(p => p.PlayerStatistic)
                .HasForeignKey<PlayerStatistic>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_stats_user");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.RefreshTokenId).HasName("PRIMARY");

            entity
                .ToTable("refresh_token")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.ExpiresAt, "idx_refresh_expires");

            entity.HasIndex(e => e.UserId, "idx_refresh_user");

            entity.HasIndex(e => e.TokenHash, "uq_refresh_token_hash").IsUnique();

            entity.Property(e => e.RefreshTokenId).HasColumnName("refresh_token_id");
            entity.Property(e => e.ExpiresAt)
                .HasColumnType("datetime")
                .HasColumnName("expires_at");
            entity.Property(e => e.Revoked).HasColumnName("revoked");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(64)
                .IsFixedLength()
                .HasColumnName("token_hash")
                .UseCollation("ascii_bin")
                .HasCharSet("ascii");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_refresh_user");
        });

        modelBuilder.Entity<Result>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LevelId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity
                .ToTable("result")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.AttemptId, "fk_result_attempt");

            entity.HasIndex(e => e.LevelId, "fk_result_level");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.Fixed)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("fixed");
            entity.Property(e => e.KeysCollected).HasColumnName("keys_collected");
            entity.Property(e => e.TickCount).HasColumnName("tick_count");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");

            entity.HasOne(d => d.Attempt).WithMany(p => p.Results)
                .HasForeignKey(d => d.AttemptId)
                .HasConstraintName("fk_result_attempt");

            entity.HasOne(d => d.Level).WithMany(p => p.Results)
                .HasForeignKey(d => d.LevelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_result_level");

            entity.HasOne(d => d.User).WithMany(p => p.Results)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_result_user");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PRIMARY");

            entity
                .ToTable("role")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "name").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
