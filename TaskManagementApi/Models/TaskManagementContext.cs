using Microsoft.EntityFrameworkCore;

namespace TaskManagementAPI.Models
{
    public class TaskManagementContext : DbContext
    {
        public TaskManagementContext(DbContextOptions<TaskManagementContext> options) : base(options)
        {
        }

        public DbSet<TaskItem> Tasks { get; set; }

        // Add other DbSet properties for additional entities if needed

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Define entity configurations and relationships here
        }
    }
}
