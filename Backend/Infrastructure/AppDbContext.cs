using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<TaskEntity> Tasks { get; set; }
        public DbSet<GoalEntity> Goals { get; set; }
        public DbSet<ObjectiveEntity> Objectives { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var stringListConverter = new ValueConverter<List<string>?, string?>(
                v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => v == null ? null : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null)
            );

            var stringListComparer = new ValueComparer<List<string>?>(
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c == null ? null : c.ToList()
            );

            modelBuilder.Entity<TaskEntity>()
                .Property(e => e.Tags)
                .HasConversion(stringListConverter, stringListComparer);

            modelBuilder.Entity<ObjectiveEntity>()
                .Property(e => e.KeyResults)
                .HasConversion(stringListConverter, stringListComparer);
        }
    }
}
