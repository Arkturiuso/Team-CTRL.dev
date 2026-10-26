using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models; // Убедись, что namespace правильный

namespace Server_RoboCode.Models.Data;

public partial class RobocodeContext : DbContext
{
    public RobocodeContext() { }

    public RobocodeContext(DbContextOptions<RobocodeContext> options) : base(options) { }

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
    public virtual DbSet<LevelCommand> LevelCommands { get; set; } = null!;
    public virtual DbSet<KnowledgeBase> KnowledgeBases { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseMySql(
                "Server=robocode-db;Port=3306;Database=robocode;User=root;Password=root_secure_pass;SslMode=None;AllowPublicKeyRetrieval=True;", 
                new MySqlServerVersion(new Version(8, 0, 0))
            );
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<AccountStatus>(entity =>
        {
            entity.HasKey(e => e.AccountStatusId).HasName("PRIMARY");
            entity.ToTable("account_status").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.Name, "name").IsUnique();
            entity.Property(e => e.AccountStatusId).HasColumnName("account_status_id");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");
            entity.ToTable("app_user").UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.AccountStatusId, "fk_user_account_status");
            entity.HasIndex(e => e.Login, "login").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AccountStatusId).HasColumnName("account_status_id");
            entity.Property(e => e.Login).HasMaxLength(64).HasColumnName("login");
            entity.Property(e => e.Password).HasMaxLength(255).HasColumnName("password");
            entity.Property(e => e.Registration)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("registration");

            entity.Property(e => e.Role)
                .HasMaxLength(10)
                .HasColumnName("role")
                .HasDefaultValue("player");

            entity.HasOne(d => d.AccountStatus).WithMany(p => p.AppUsers)
                .HasForeignKey(d => d.AccountStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_user_account_status");

            // ⚠️ ЗДЕСЬ БОЛЬШЕ НЕТ UsingEntity<Dictionary>. Связь управляется ниже через KnowledgeBase.
        });

        modelBuilder.Entity<Attempt>(entity =>
        {
            entity.HasKey(e => e.AttemptId).HasName("PRIMARY");
            entity.ToTable("attempt").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.LevelId, "fk_attempt_level");
            entity.HasIndex(e => e.AttemptStatusId, "fk_attempt_status");
            entity.HasIndex(e => e.UserId, "fk_attempt_user");

            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.AttemptStatusId).HasColumnName("attempt_status_id");
            entity.Property(e => e.ErrorMessage).HasColumnType("text").HasColumnName("error_message");
            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.LinesCount).HasColumnName("lines_count");
            entity.Property(e => e.SourceCode).HasColumnType("text").HasColumnName("source_code");
            entity.Property(e => e.Submitted).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("datetime").HasColumnName("submitted");
            entity.Property(e => e.TickCount).HasColumnName("tick_count");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.AttemptStatus).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.AttemptStatusId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_attempt_status");
            entity.HasOne(d => d.Level).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.LevelId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_attempt_level");
            entity.HasOne(d => d.User).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_attempt_user");
        });

        modelBuilder.Entity<AttemptStatus>(entity =>
        {
            entity.HasKey(e => e.AttemptStatusId).HasName("PRIMARY");
            entity.ToTable("attempt_status").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.Name, "name").IsUnique();
            entity.Property(e => e.AttemptStatusId).HasColumnName("attempt_status_id");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<Command>(e =>
        {
            e.ToTable("command");
            e.HasKey(x => x.CommandId);
            e.Property(x => x.CommandId).HasColumnName("command_id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Syntax).HasColumnName("syntax");
            e.Property(x => x.Description).HasColumnName("description");
        });

        modelBuilder.Entity<LevelCommand>(e =>
        {
            e.ToTable("level_command");
            e.HasKey(x => new { x.LevelId, x.CommandId });
            e.Property(x => x.LevelId).HasColumnName("level_id");
            e.Property(x => x.CommandId).HasColumnName("command_id");
            e.HasOne(x => x.Level).WithMany(l => l.LevelCommands).HasForeignKey(x => x.LevelId);
            e.HasOne(x => x.Command).WithMany().HasForeignKey(x => x.CommandId);
        });

        // ✅ ЕДИНСТВЕННАЯ И ПРАВИЛЬНАЯ НАСТРОЙКА KNOWLEDGE_BASE
        modelBuilder.Entity<KnowledgeBase>(e =>
        {
            e.ToTable("knowledge_base");
            e.HasKey(x => new { x.UserId, x.CommandId });
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.CommandId).HasColumnName("command_id");
            
            e.HasOne(x => x.User)
             .WithMany(u => u.KnowledgeBases)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
             
            e.HasOne(x => x.Command)
             .WithMany(c => c.KnowledgeBases)
             .HasForeignKey(x => x.CommandId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Difficulty>(entity =>
        {
            entity.HasKey(e => e.DifficultyId).HasName("PRIMARY");
            entity.ToTable("difficulty").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.Name, "name").IsUnique();
            entity.Property(e => e.DifficultyId).HasColumnName("difficulty_id");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<Leaderboard>(entity =>
        {
            entity.HasKey(e => e.Position).HasName("PRIMARY");
            entity.ToTable("leaderboard").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.UserId, "uq_leaderboard_user").IsUnique();

            entity.Property(e => e.Position).ValueGeneratedNever().HasColumnName("position");
            entity.Property(e => e.Login).HasMaxLength(64).HasColumnName("login");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");
            entity.Property(e => e.Updated).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("datetime").HasColumnName("updated");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Leaderboard)
                .HasForeignKey<Leaderboard>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_leaderboard_user");
        });

        modelBuilder.Entity<Level>(entity =>
        {
            entity.HasKey(e => e.LevelId).HasName("PRIMARY");
            entity.ToTable("level").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.DifficultyId, "fk_level_difficulty");
            entity.HasIndex(e => e.LevelStatusId, "fk_level_status");

            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("datetime").HasColumnName("created");
            entity.Property(e => e.DifficultyId).HasColumnName("difficulty_id");
            entity.Property(e => e.LevelStatusId).HasColumnName("level_status_id");

            entity.Property(e => e.MapData)
                .HasColumnType("json")
                .HasColumnName("map_data");

            entity.HasOne(d => d.Difficulty).WithMany(p => p.Levels)
                .HasForeignKey(d => d.DifficultyId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_level_difficulty");
            entity.HasOne(d => d.LevelStatus).WithMany(p => p.Levels)
                .HasForeignKey(d => d.LevelStatusId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_level_status");
        });

        modelBuilder.Entity<LevelStatus>(entity =>
        {
            entity.HasKey(e => e.LevelStatusId).HasName("PRIMARY");
            entity.ToTable("level_status").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.Name, "name").IsUnique();
            entity.Property(e => e.LevelStatusId).HasColumnName("level_status_id");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<PlayerStatistic>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");
            entity.ToTable("player_statistics").UseCollation("utf8mb4_unicode_ci");

            entity.Property(e => e.UserId).ValueGeneratedNever().HasColumnName("user_id");
            entity.Property(e => e.LastUpdate).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("datetime").HasColumnName("last_update");
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
            entity.ToTable("refresh_token").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.ExpiresAt, "idx_refresh_expires");
            entity.HasIndex(e => e.UserId, "idx_refresh_user");
            entity.HasIndex(e => e.TokenHash, "uq_refresh_token_hash").IsUnique();

            entity.Property(e => e.RefreshTokenId).HasColumnName("refresh_token_id");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime").HasColumnName("expires_at");
            entity.Property(e => e.Revoked).HasColumnName("revoked");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(64).IsFixedLength().HasColumnName("token_hash")
                .UseCollation("ascii_bin").HasCharSet("ascii");
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
            entity.ToTable("result").UseCollation("utf8mb4_unicode_ci");
            entity.HasIndex(e => e.AttemptId, "fk_result_attempt");
            entity.HasIndex(e => e.LevelId, "fk_result_level");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.Fixed).HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("datetime").HasColumnName("fixed");
            entity.Property(e => e.TickCount).HasColumnName("tick_count");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");

            entity.HasOne(d => d.Attempt).WithMany(p => p.Results)
                .HasForeignKey(d => d.AttemptId).HasConstraintName("fk_result_attempt");
            entity.HasOne(d => d.Level).WithMany(p => p.Results)
                .HasForeignKey(d => d.LevelId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_result_level");
            entity.HasOne(d => d.User).WithMany(p => p.Results)
                .HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("fk_result_user");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}